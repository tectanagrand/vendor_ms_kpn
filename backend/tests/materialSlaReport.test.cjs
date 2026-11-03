const assert = require("node:assert/strict");
const test = require("node:test");
const pool = require("../config/connection");
const materialService = require("../services/materialService");
const { getBusinessUnit, getMaterialSlaReport } = require("../services/materialSlaReportService");

test("business unit reads mst_company.group_comp and nothing else", () => {
    assert.equal(getBusinessUnit("UPSTREAM"), "Upstream");
    assert.equal(getBusinessUnit(" downstream "), "Downstream");
    assert.equal(getBusinessUnit(null), "-");
    assert.equal(getBusinessUnit(""), "-");
    assert.equal(getBusinessUnit("TRADING"), "-");
});

test("SLA report rows show '-' for an unmapped company or a missing plant", async () => {
    const originals = {
        query: pool.query,
        refresh: materialService.refreshMaterialAdminUsernames,
        admin: materialService.isAdminMaterialApprover,
    };
    const base = {
        request_status: "WAITING",
        request_at: "2026-11-02T02:00:00Z",
        report_as_of: "2026-11-03T02:00:00Z",
    };
    materialService.refreshMaterialAdminUsernames = async () => {};
    materialService.isAdminMaterialApprover = username => username === "test-admin";
    pool.query = async () => ({
        rows: [
            { ...base, item_id: "mapped", plant_code: "TH01", group_comp: "UPSTREAM" },
            // AG has plants in mst_plant but no mst_company row.
            { ...base, item_id: "unmapped", plant_code: "AG2A", group_comp: null },
            { ...base, item_id: "no-plant", plant_code: null, group_comp: null },
        ],
    });
    try {
        const { rows } = await getMaterialSlaReport({ actorUsername: "test-admin" });
        assert.deepEqual(
            rows.map(row => [row.item_id, row.plant_code, row.business_unit]),
            [
                ["mapped", "TH01", "Upstream"],
                ["unmapped", "AG2A", "-"],
                ["no-plant", "-", "-"],
            ]
        );
    } finally {
        pool.query = originals.query;
        materialService.refreshMaterialAdminUsernames = originals.refresh;
        materialService.isAdminMaterialApprover = originals.admin;
    }
});
