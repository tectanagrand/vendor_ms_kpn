const db = require("../config/connection.js");

const Material = {
    // Get all material groups
    getMaterialGroups: async () => {
        try {
            const client = await db.connect();
            const result = await client.query(`
                SELECT id, code, name
                FROM mat_item_group
                ORDER BY code
            `);
            client.release();
            return result.rows;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    // Get materials by group ID
    getMaterialsByGroup: async (groupId, page = 1, pageSize = 10) => {
        try {
            const client = await db.connect();
            const offset = (page - 1) * pageSize;

            // First get the total count
            const countQuery = await client.query(
                `
                SELECT COUNT(*) as total
                FROM mat_sap_data m
                JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                JOIN mat_item_group mig ON mis.item_group_id = mig.id
                WHERE mig.id = $1
                `,
                [groupId]
            );

            const totalCount = parseInt(countQuery.rows[0].total);
            const totalPages = Math.ceil(totalCount / pageSize);

            const result = await client.query(
                `
                WITH group_info AS (
                    SELECT id, code, name
                    FROM mat_item_group
                    WHERE id = $1
                )
                SELECT
                    m.id,
                    m.code,
                    m.name,
                    m.description,
                    m.alias1,
                    m.alias2,
                    m.alias3,
                    m.filter_code_1,
                    m.filter_code_2,
                    m.created_at,
                    m.updated_at,
                    mis.code as "subGroupCode",
                    mis.name as "subGroupName",
                    mig.code as "groupCode",
                    mig.name as "groupName",
                    CONCAT(mig.code, '.', mis.code) as "fullCode",
                    COALESCE(
                        JSON_AGG(
                            CASE
                                WHEN ma.id IS NOT NULL
                                THEN JSON_BUILD_OBJECT('id', ma.id, 'attachment', ma.attachment, 'type', ma.type)
                                ELSE NULL
                            END
                        ) FILTER (WHERE ma.id IS NOT NULL),
                        '[]'::json
                    ) as attachments,
                    (SELECT JSON_BUILD_OBJECT('id', g.id, 'code', g.code, 'name', g.name) FROM group_info g) as group_details
                FROM mat_sap_data m
                JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                JOIN mat_item_group mig ON mis.item_group_id = mig.id
                LEFT JOIN mat_attachment ma ON m.id = ma.material_id
                WHERE mig.id = $1
                GROUP BY m.id, m.name, m.description, m.alias1, m.alias2, m.alias3, m.code,
                         m.filter_code_1, m.filter_code_2, m.created_at, m.updated_at,
                         mis.code, mis.name, mig.code, mig.name
                ORDER BY m.name
                LIMIT $2 OFFSET $3
            `,
                [groupId, pageSize, offset]
            );
            client.release();

            // Extract group details from the first row
            const groupDetails =
                result.rows.length > 0 ? result.rows[0].group_details : null;

            return {
                materials: result.rows.map(row => {
                    // Remove the group_details from each row before returning
                    const { group_details, ...material } = row;
                    return material;
                }),
                group: groupDetails,
                pagination: {
                    page,
                    pageSize,
                    totalCount,
                    totalPages,
                },
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    // Get subgroups by group ID
    getMaterialSubGroups: async groupId => {
        try {
            const client = await db.connect();
            const result = await client.query(
                `
                SELECT mis.id, mis.code, mis.name, mis.item_group_id, mig.code as groupCode, mig.name as groupName
                FROM mat_item_sub_group mis
                JOIN mat_item_group mig ON mis.item_group_id = mig.id
                WHERE mis.item_group_id = $1
                ORDER BY mis.code
            `,
                [groupId]
            );
            client.release();
            return result.rows;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    // Get materials by subgroup ID
    getMaterialsBySubGroup: async (subGroupId, page = 1, pageSize = 10) => {
        try {
            const client = await db.connect();
            const offset = (page - 1) * pageSize;

            // First get the total count
            const countQuery = await client.query(
                `
                SELECT COUNT(*) as total
                FROM mat_sap_data m
                WHERE m.material_sub_group_id = $1
                `,
                [subGroupId]
            );

            const totalCount = parseInt(countQuery.rows[0].total);
            const totalPages = Math.ceil(totalCount / pageSize);

            const result = await client.query(
                `
                WITH subgroup_info AS (
                    SELECT
                        mis.id,
                        mis.code as subgroup_code,
                        mis.name as subgroup_name,
                        mis.item_group_id,
                        mig.id as group_id,
                        mig.code as group_code,
                        mig.name as group_name
                    FROM mat_item_sub_group mis
                    JOIN mat_item_group mig ON mis.item_group_id = mig.id
                    WHERE mis.id = $1
                )
                SELECT
                    m.id,
                    m.code,
                    m.name,
                    m.description,
                    m.alias1,
                    m.alias2,
                    m.alias3,
                    m.filter_code_1,
                    m.filter_code_2,
                    m.created_at,
                    m.updated_at,
                    mis.code as "subGroupCode",
                    mis.name as "subGroupName",
                    mig.code as "groupCode",
                    mig.name as "groupName",
                    CONCAT(mig.code, '.', mis.code) as "fullCode",
                    COALESCE(
                        JSON_AGG(
                            CASE
                                WHEN ma.id IS NOT NULL
                                THEN JSON_BUILD_OBJECT('id', ma.id, 'attachment', ma.attachment, 'type', ma.type)
                                ELSE NULL
                            END
                        ) FILTER (WHERE ma.id IS NOT NULL),
                        '[]'::json
                    ) as attachments,
                    (
                        SELECT JSON_BUILD_OBJECT(
                            'subGroup', JSON_BUILD_OBJECT('id', s.id, 'code', s.subgroup_code, 'name', s.subgroup_name),
                            'group', JSON_BUILD_OBJECT('id', s.group_id, 'code', s.group_code, 'name', s.group_name)
                        )
                        FROM subgroup_info s
                    ) as group_info
                FROM mat_sap_data m
                JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                JOIN mat_item_group mig ON mis.item_group_id = mig.id
                LEFT JOIN mat_attachment ma ON m.id = ma.material_id
                WHERE m.material_sub_group_id = $1
                GROUP BY m.id, m.name, m.description, m.alias1, m.alias2, m.alias3, m.code,
                         m.filter_code_1, m.filter_code_2, m.created_at, m.updated_at, mis.code, mis.name, mig.code, mig.name
                ORDER BY m.name
                LIMIT $2 OFFSET $3
            `,
                [subGroupId, pageSize, offset]
            );
            client.release();

            // Extract group and subgroup details from the first row
            const groupInfo =
                result.rows.length > 0
                    ? result.rows[0].group_info
                    : {
                          subGroup: { id: null, code: null, name: null },
                          group: { id: null, code: null, name: null },
                      };

            return {
                materials: result.rows.map(row => {
                    // Remove the group_info from each row before returning
                    const { group_info, ...material } = row;
                    return material;
                }),
                subGroup: groupInfo.subGroup,
                group: groupInfo.group,
                pagination: {
                    page,
                    pageSize,
                    totalCount,
                    totalPages,
                },
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    // Search materials by various criteria
    searchMaterials: async (searchTerm, page = 1, pageSize = 10) => {
        try {
            const client = await db.connect();
            const offset = (page - 1) * pageSize;

            const safeSearchTerm = String(searchTerm || "").trim();
            const pattern = `%${safeSearchTerm}%`;

            console.log("Search term received:", safeSearchTerm);
            console.log("Search pattern:", pattern);
            console.log("Page:", page, "Page Size:", pageSize);

            // First get the total count
            const countQuery = await client.query(
                `
                SELECT COUNT(*) as total
                FROM mat_sap_data m
                WHERE
                    m.name ILIKE $1 OR
                    m.description ILIKE $1 OR
                    COALESCE(m.alias1, '') ILIKE $1 OR
                    COALESCE(m.alias2, '') ILIKE $1 OR
                    COALESCE(m.alias3, '') ILIKE $1 OR
                    m.code ILIKE $1
                `,
                [pattern]
            );

            const totalCount = parseInt(countQuery.rows[0].total);
            const totalPages = Math.ceil(totalCount / pageSize);

            console.log("Total count:", totalCount, "Total pages:", totalPages);

            // Using ILIKE for case-insensitive searching
            console.log(
                "Executing search query with ILIKE for case-insensitivity"
            );

            // First, get the materials that match the search term
            const result = await client.query(
                `
                SELECT
                    m.id,
                    m.code,
                    m.name,
                    m.description,
                    m.alias1,
                    m.alias2,
                    m.alias3,
                    m.filter_code_1,
                    m.filter_code_2,
                    m.material_sub_group_id,
                    m.created_at,
                    m.updated_at,
                    m.dfFromClient
                FROM mat_sap_data m
                WHERE
                    m.name ILIKE $1 OR
                    m.description ILIKE $1 OR
                    COALESCE(m.alias1, '') ILIKE $1 OR
                    COALESCE(m.alias2, '') ILIKE $1 OR
                    COALESCE(m.alias3, '') ILIKE $1 OR
                    m.code ILIKE $1
                ORDER BY m.name
                LIMIT $2 OFFSET $3
            `,
                [pattern, pageSize, offset]
            );

            console.log(
                `Found ${result.rows.length} materials matching search term (page ${page})`
            );

            // If no materials found, return empty array
            if (result.rows.length === 0) {
                client.release();
                return {
                    materials: [],
                    pagination: {
                        page,
                        pageSize,
                        totalCount,
                        totalPages,
                    },
                };
            }

            // Get the subgroup and group information for these materials
            const materialIds = result.rows.map(m => m.id);
            const subGroupIds = result.rows.map(m => m.material_sub_group_id);

            // Get subgroup and group information
            const groupInfoQuery = await client.query(
                `
                SELECT
                    mis.id as subgroup_id,
                    mis.code as "subGroupCode",
                    mis.name as "subGroupName",
                    mig.code as "groupCode",
                    mig.name as "groupName",
                    mig.id as group_id
                FROM mat_item_sub_group mis
                JOIN mat_item_group mig ON mis.item_group_id = mig.id
                WHERE mis.id = ANY($1)
                `,
                [subGroupIds]
            );

            // Create a lookup map for subgroup info
            const subgroupInfoMap = {};
            groupInfoQuery.rows.forEach(row => {
                subgroupInfoMap[row.subgroup_id] = {
                    subGroupCode: row.subGroupCode,
                    subGroupName: row.subGroupName,
                    groupCode: row.groupCode,
                    groupName: row.groupName,
                    fullCode: `${row.groupCode}.${row.subGroupCode}`,
                };
            });

            // Get attachments for all materials in one query
            const attachmentsQuery = await client.query(
                `SELECT material_id, id, attachment, type
                 FROM mat_attachment
                 WHERE material_id = ANY($1)`,
                [materialIds]
            );

            // Group attachments by material_id
            const attachmentsByMaterialId = {};
            attachmentsQuery.rows.forEach(attachment => {
                if (!attachmentsByMaterialId[attachment.material_id]) {
                    attachmentsByMaterialId[attachment.material_id] = [];
                }
                attachmentsByMaterialId[attachment.material_id].push({
                    id: attachment.id,
                    attachment: attachment.attachment,
                    type: attachment.type,
                });
            });

            // Combine all data into final results
            const finalResults = result.rows.map(material => {
                const subgroupInfo =
                    subgroupInfoMap[material.material_sub_group_id] || {};
                return {
                    ...material,
                    subGroupCode: subgroupInfo.subGroupCode,
                    subGroupName: subgroupInfo.subGroupName,
                    groupCode: subgroupInfo.groupCode,
                    groupName: subgroupInfo.groupName,
                    fullCode: subgroupInfo.fullCode,
                    attachments: attachmentsByMaterialId[material.id] || [],
                };
            });

            client.release();
            console.log(
                `Final result: ${finalResults.length} materials for search: ${safeSearchTerm}`
            );

            return {
                materials: finalResults,
                pagination: {
                    page,
                    pageSize,
                    totalCount,
                    totalPages,
                },
            };
        } catch (error) {
            console.error("Search error:", error);
            throw error;
        }
    },

    // Get material by ID with full details
    getMaterialById: async materialId => {
        try {
            const client = await db.connect();
            const result = await client.query(
                `
                SELECT
                    m.id,
                    m.code,
                    m.name,
                    m.description,
                    m.alias1,
                    m.alias2,
                    m.alias3,
                    m.filter_code_1,
                    m.filter_code_2,
                    m.created_at,
                    m.updated_at,
                    m.dfFromClient,
                    mis.id as "subGroupId",
                    mis.code as "subGroupCode",
                    mis.name as "subGroupName",
                    mig.id as "groupId",
                    mig.code as "groupCode",
                    mig.name as "groupName",
                    CONCAT(mig.code, '.', mis.code) as "fullCode"
                FROM mat_sap_data m
                JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                JOIN mat_item_group mig ON mis.item_group_id = mig.id
                WHERE m.id = $1
            `,
                [materialId]
            );
            client.release();
            return result.rows[0];
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
};

module.exports = Material;
