const pool = require("../config/connection");
const materialService = require("./materialService");
const { normalizeDashboardFilters } = require("./materialDashboardService");

const SLA_REPORT_QUERY = `
WITH items AS (
    SELECT 'SINGLE'::text AS request_kind, r.id AS item_id, NULL::bigint AS batch_id,
           r.request_no AS ticket_number, COALESCE(r.material_code, r.final_code) AS material_code,
           r.material_description, COALESCE(g.code, 'Unspecified') AS material_group,
           COALESCE(u.username, r.created_by) AS requester, u.department,
           r.status AS request_status, r.created_at AS request_at, r.updated_at,
           r.plant_code
    FROM mat_single_request r
    LEFT JOIN mat_item_group g ON g.id = r.material_group_id
    LEFT JOIN mst_user u ON u.user_id = r.created_by
    WHERE ($3 = 'all' OR $3 = 'single')
      AND ($1::date IS NULL OR r.created_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Jakarta'))
      AND ($2::date IS NULL OR r.created_at < (($2::date + 1)::timestamp AT TIME ZONE 'Asia/Jakarta'))

    UNION ALL

    SELECT 'MASS', i.id, m.id, i.request_no, i.final_code,
           i.material_description,
           COALESCE(NULLIF(BTRIM(i.material_group), ''), 'Unspecified'),
           COALESCE(u.username, i.created_by), u.department,
           i.status, m.created_at, i.updated_at,
           i.plant_code
    FROM mat_mass_request_item i
    JOIN mat_mass_request m ON m.id = i.mass_request_id
    LEFT JOIN mst_user u ON u.user_id = i.created_by
    WHERE ($3 = 'all' OR $3 = 'mass')
      AND ($1::date IS NULL OR m.created_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Jakarta'))
      AND ($2::date IS NULL OR m.created_at < (($2::date + 1)::timestamp AT TIME ZONE 'Asia/Jakarta'))
), step_rows AS (
    SELECT 'SINGLE'::text AS request_kind, s.request_id AS item_id, s.level, s.kind,
           s.status, s.acted_at, s.approver_user_id,
           COALESCE(u.fullname, u.username, s.approver_user_id) AS approver
    FROM mat_single_request_approval_step s
    LEFT JOIN mst_user u ON u.user_id = s.approver_user_id
    UNION ALL
    SELECT 'MASS', s.item_id, s.level, s.kind, s.status, s.acted_at, s.approver_user_id,
           COALESCE(u.fullname, u.username, s.approver_user_id)
    FROM mat_mass_request_item_approval_step s
    LEFT JOIN mst_user u ON u.user_id = s.approver_user_id
), step_rollup AS (
    SELECT request_kind, item_id,
           BOOL_OR(kind = 'MANUAL') AS has_manual_steps,
           MAX(acted_at) FILTER (
               WHERE kind = 'MANUAL' AND UPPER(COALESCE(status, '')) = 'APPROVED'
           ) AS last_manual_approval,
           JSONB_AGG(JSONB_BUILD_OBJECT(
               'level', level, 'kind', kind, 'status', status,
               'acted_at', acted_at, 'approver', approver
           ) ORDER BY level) FILTER (WHERE kind = 'MANUAL') AS stages
    FROM step_rows
    GROUP BY request_kind, item_id
), comment_rows AS (
    SELECT c.request_kind, c.request_id, c.event_type, c.stage,
           c.created_at, c.id, c.actor_user_id,
           COALESCE(u.fullname, u.username, c.actor_user_id) AS actor_name
    FROM mat_request_comment c
    LEFT JOIN mst_user u ON u.user_id = c.actor_user_id
), comment_rollup AS (
    SELECT request_kind, request_id,
           (ARRAY_AGG(created_at ORDER BY created_at, id) FILTER (
               WHERE stage = 'Master Data'
                 AND event_type IN ('REWORK', 'REJECT', 'CORRESPONDENCE')
           ))[1] AS response_at,
           (ARRAY_AGG(event_type ORDER BY created_at, id) FILTER (
               WHERE stage = 'Master Data'
                 AND event_type IN ('REWORK', 'REJECT', 'CORRESPONDENCE')
           ))[1] AS response_event,
           (ARRAY_AGG(actor_name ORDER BY created_at, id) FILTER (
               WHERE stage = 'Master Data'
                 AND event_type IN ('REWORK', 'REJECT', 'CORRESPONDENCE')
           ))[1] AS responded_by,
           MAX(created_at) FILTER (
               WHERE stage = 'Master Data' AND event_type = 'APPROVE'
           ) AS mdm_approved_at,
           (ARRAY_AGG(actor_name ORDER BY created_at DESC, id DESC) FILTER (
               WHERE stage = 'Master Data' AND event_type = 'APPROVE'
           ))[1] AS mdm_approved_by,
           MAX(created_at) FILTER (WHERE event_type = 'REJECT') AS cancelled_at
    FROM comment_rows
    GROUP BY request_kind, request_id
)
SELECT i.request_kind, i.item_id, i.ticket_number, i.material_code, i.material_description,
       i.material_group, i.requester, i.department, i.request_status, i.request_at,
       i.plant_code,
       COALESCE(mc.group_comp, mc_fb.group_comp) AS group_comp,
       CASE
           WHEN approvals.last_manual_approval IS NOT NULL THEN approvals.last_manual_approval
           WHEN NOT COALESCE(approvals.has_manual_steps, FALSE) THEN i.request_at
           ELSE NULL
       END AS final_approval_at,
       comments.response_at, comments.response_event, comments.responded_by,
       comments.mdm_approved_by,
       CASE WHEN UPPER(BTRIM(i.request_status)) = 'DONE' THEN comments.mdm_approved_at END AS completion_at,
       CASE WHEN UPPER(BTRIM(i.request_status)) IN ('CANCEL', 'CANCELLED')
            THEN COALESCE(comments.cancelled_at, i.updated_at) END AS cancelled_at,
       COALESCE(approvals.stages, '[]'::jsonb) AS approval_stages,
       CURRENT_TIMESTAMP AS report_as_of
FROM items i
LEFT JOIN mst_plant mp ON mp.plant_code = i.plant_code
LEFT JOIN mst_company mc ON mc.sap_code = mp.company_code
LEFT JOIN mst_company mc_fb ON mc_fb.sap_code = SUBSTRING(i.plant_code FROM 1 FOR 2)
LEFT JOIN step_rollup approvals
    ON approvals.request_kind = i.request_kind AND approvals.item_id = i.item_id
LEFT JOIN comment_rollup comments
    ON comments.request_kind = i.request_kind
   AND comments.request_id = COALESCE(i.batch_id, i.item_id)
ORDER BY i.request_at, i.ticket_number`;

function cutoffDayOrdinal(value) {
    const date = value instanceof Date ? value : new Date(value);
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);
    const part = key => Number(parts.find(entry => entry.type === key)?.value);
    const year = part("year");
    const month = part("month");
    let day = part("day");
    if (part("hour") < 16 || (part("hour") === 16 && part("minute") < 45)) day -= 1;
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function calculateSlaDays(startAt, endAt) {
    if (!startAt || !endAt) return null;
    return Math.max(1, cutoffDayOrdinal(endAt) - cutoffDayOrdinal(startAt));
}

// Business Unit comes from master data only: the request's plant ->
// mst_plant.company_code -> mst_company.group_comp. A company master data does
// not classify reads "-" rather than a guess from the plant code, so a missing
// mapping shows up in the report instead of hiding behind a default.
function getBusinessUnit(groupComp) {
    const norm = String(groupComp ?? "").trim().toUpperCase();
    if (norm === "UPSTREAM") return "Upstream";
    if (norm === "DOWNSTREAM") return "Downstream";
    return "-";
}

async function getMaterialSlaReport({ actorUsername, query = {} } = {}) {
    await materialService.refreshMaterialAdminUsernames({ minAgeMs: 10000 });
    if (!materialService.isAdminMaterialApprover(actorUsername)) {
        throw Object.assign(new Error("Material Administrator access is required."), {
            statusCode: 403,
        });
    }

    const filters = normalizeDashboardFilters(query);
    const { rows } = await pool.query(SLA_REPORT_QUERY, [
        filters.dateFrom,
        filters.dateTo,
        filters.requestKind,
    ]);

    return {
        filters,
        cutoff: "16:45",
        timezone: "Asia/Jakarta",
        rows: rows.map(row => {
            const cancelled = ["CANCEL", "CANCELLED"].includes(
                String(row.request_status || "").trim().toUpperCase()
            );
            const responseEnd = row.response_at || row.completion_at ||
                (cancelled ? row.cancelled_at : row.report_as_of);
            const journeyEnd = row.completion_at ||
                (cancelled ? row.cancelled_at : row.report_as_of);
            return {
                ...row,
                plant_code: row.plant_code || "-",
                business_unit: getBusinessUnit(row.group_comp),
                response_sla_days: calculateSlaDays(row.request_at, responseEnd),
                ticket_journey_days: calculateSlaDays(row.request_at, journeyEnd),
                is_responded: Boolean(row.response_at),
            };
        }),
    };
}

module.exports = {
    SLA_REPORT_QUERY,
    calculateSlaDays,
    cutoffDayOrdinal,
    getBusinessUnit,
    getMaterialSlaReport,
};
