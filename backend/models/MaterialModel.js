const db = require("../config/connection.js");
const Crud = require("../helper/crudquery.js");
const fs = require("fs");
const path = require("path");
const DBClientWrapper = require("../helper/DBClientWrapper.js");
const getMimeType = require("../helper/mimetype.js");
const xlsx = require("xlsx");
const toTsQuery = require("../helper/tsQuery.js");

const Material = {
    // Create a new material group
    createMaterialGroup: async groupData => {
        try {
            return await DBClientWrapper(async client => {
                const { code, name } = groupData;

                // Check if code already exists
                const existingCode = await client.query(
                    "SELECT id FROM mat_item_group WHERE code = $1",
                    [code]
                );

                if (existingCode.rows.length > 0) {
                    throw new Error("Group code already exists");
                }

                const now = new Date();
                const result = await client.query(
                    `INSERT INTO mat_item_group (code, name, created_at, updated_at)
                     VALUES ($1, $2, $3, $4)
                     RETURNING id, code, name`,
                    [code, name, now, now]
                );

                return result.rows[0];
            });
        } catch (error) {
            console.error("Error creating material group:", error);
            throw error;
        }
    },

    // Update material group
    updateMaterialGroup: async (groupId, groupData) => {
        try {
            return await DBClientWrapper(async client => {
                const { code, name } = groupData;

                // Check if code already exists for another group
                if (code) {
                    const existingCode = await client.query(
                        "SELECT id FROM mat_item_group WHERE code = $1 AND id != $2",
                        [code, groupId]
                    );

                    if (existingCode.rows.length > 0) {
                        throw new Error("Group code already exists");
                    }
                }

                const now = new Date();
                let query = "UPDATE mat_item_group SET updated_at = $1";
                const params = [now];
                let paramIndex = 2;

                if (code) {
                    query += `, code = $${paramIndex}`;
                    params.push(code);
                    paramIndex++;
                }

                if (name) {
                    query += `, name = $${paramIndex}`;
                    params.push(name);
                    paramIndex++;
                }

                query += ` WHERE id = $${paramIndex} RETURNING id, code, name`;
                params.push(groupId);

                const result = await client.query(query, params);

                if (result.rows.length === 0) {
                    throw new Error("Group not found");
                }

                return result.rows[0];
            });
        } catch (error) {
            console.error("Error updating material group:", error);
            throw error;
        }
    },

    // Delete material group
    deleteMaterialGroup: async groupId => {
        try {
            return await DBClientWrapper(async client => {
                // Begin transaction
                await client.query("BEGIN");

                try {
                    // Check if group has subgroups
                    const subgroupsCheck = await client.query(
                        "SELECT id FROM mat_item_sub_group WHERE item_group_id = $1 LIMIT 1",
                        [groupId]
                    );

                    if (subgroupsCheck.rows.length > 0) {
                        throw new Error(
                            "Cannot delete group with existing subgroups"
                        );
                    }

                    // Delete the group
                    const result = await client.query(
                        "DELETE FROM mat_item_group WHERE id = $1 RETURNING id",
                        [groupId]
                    );

                    if (result.rows.length === 0) {
                        throw new Error("Group not found");
                    }

                    // Commit transaction
                    await client.query("COMMIT");

                    return { id: groupId, deleted: true };
                } catch (error) {
                    // Rollback transaction on error
                    await client.query("ROLLBACK");
                    throw error;
                }
            });
        } catch (error) {
            console.error("Error deleting material group:", error);
            throw error;
        }
    },

    // Get all material groups
    getMaterialGroups: async (page, pageSize, searchQuery = "") => {
        try {
            return await DBClientWrapper(async client => {
                const offset = (page - 1) * pageSize;
                const searchPattern = searchQuery ? `%${searchQuery}%` : null;

                // First get the total count with search filter if provided
                const countQuery = searchPattern
                    ? await client.query(
                          `SELECT COUNT(*) as total FROM mat_item_group WHERE code ILIKE $1 OR name ILIKE $1`,
                          [searchPattern]
                      )
                    : await client.query(
                          `SELECT COUNT(*) as total FROM mat_item_group`
                      );

                const totalCount = parseInt(countQuery.rows[0].total);

                // Query with search filter if provided
                const queryText = searchPattern
                    ? `
                        SELECT
                            mig.id,
                            mig.code,
                            mig.name,
                            (SELECT COUNT(*) FROM mat_item_sub_group WHERE item_group_id = mig.id) as subgroups_count,
                            (
                                SELECT COUNT(*)
                                FROM mat_sap_data m
                                JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                                WHERE mis.item_group_id = mig.id
                            ) as materials_count
                        FROM mat_item_group mig
                        WHERE mig.code ILIKE $3 OR mig.name ILIKE $3
                        ORDER BY mig.code
                        LIMIT $1 OFFSET $2
                    `
                    : `
                        SELECT
                            mig.id,
                            mig.code,
                            mig.name,
                            (SELECT COUNT(*) FROM mat_item_sub_group WHERE item_group_id = mig.id) as subgroups_count,
                            (
                                SELECT COUNT(*)
                                FROM mat_sap_data m
                                JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                                WHERE mis.item_group_id = mig.id
                            ) as materials_count
                        FROM mat_item_group mig
                        ORDER BY mig.code
                        LIMIT $1 OFFSET $2
                    `;

                const queryParams = searchPattern
                    ? [pageSize, offset, searchPattern]
                    : [pageSize, offset];

                const result = await client.query(queryText, queryParams);

                return {
                    data: result.rows,
                    pagination: {
                        totalCount,
                        totalPages: Math.ceil(totalCount / pageSize),
                    },
                };
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    // Get all material groups for dropdown (no pagination)
    getAllMaterialGroups: async () => {
        try {
            return await DBClientWrapper(async client => {
                const result = await client.query(`
                    SELECT
                        id,
                        code,
                        name
                    FROM mat_item_group
                    ORDER BY code
                `);

                return result.rows;
            });
        } catch (error) {
            console.error("Error getting all material groups:", error);
            throw error;
        }
    },

    // Get all subgroups for a group for dropdown (no pagination)
    getAllSubgroupsByGroup: async groupId => {
        try {
            return await DBClientWrapper(async client => {
                const result = await client.query(
                    `
                    SELECT
                        id,
                        code,
                        name,
                        item_group_id
                    FROM mat_item_sub_group
                    WHERE item_group_id = $1
                    ORDER BY code
                `,
                    [groupId]
                );

                return result.rows;
            });
        } catch (error) {
            console.error("Error getting all subgroups for group:", error);
            throw error;
        }
    },

    // Create a new material subgroup
    createMaterialSubGroup: async subGroupData => {
        try {
            return await DBClientWrapper(async client => {
                const { code, name, item_group_id } = subGroupData;

                // Check if group exists
                const groupCheck = await client.query(
                    "SELECT id FROM mat_item_group WHERE id = $1",
                    [item_group_id]
                );

                if (groupCheck.rows.length === 0) {
                    throw new Error("Parent group not found");
                }

                // Check if code already exists within this group
                const existingCode = await client.query(
                    "SELECT id FROM mat_item_sub_group WHERE code = $1 AND item_group_id = $2",
                    [code, item_group_id]
                );

                if (existingCode.rows.length > 0) {
                    throw new Error(
                        "Subgroup code already exists within this group"
                    );
                }

                const now = new Date();
                const result = await client.query(
                    `INSERT INTO mat_item_sub_group (code, name, item_group_id, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING id, code, name, item_group_id`,
                    [code, name, item_group_id, now, now]
                );

                return result.rows[0];
            });
        } catch (error) {
            console.error("Error creating material subgroup:", error);
            throw error;
        }
    },

    // Update material subgroup
    updateMaterialSubGroup: async (subGroupId, subGroupData) => {
        try {
            return await DBClientWrapper(async client => {
                const { code, name, item_group_id } = subGroupData;

                // If changing group, check if new group exists
                if (item_group_id) {
                    const groupCheck = await client.query(
                        "SELECT id FROM mat_item_group WHERE id = $1",
                        [item_group_id]
                    );

                    if (groupCheck.rows.length === 0) {
                        throw new Error("Parent group not found");
                    }
                }

                // Get current subgroup data
                const currentSubgroup = await client.query(
                    "SELECT item_group_id FROM mat_item_sub_group WHERE id = $1",
                    [subGroupId]
                );

                if (currentSubgroup.rows.length === 0) {
                    throw new Error("Subgroup not found");
                }

                const currentGroupId =
                    item_group_id || currentSubgroup.rows[0].item_group_id;

                // Check if code already exists within the group for another subgroup
                if (code) {
                    const existingCode = await client.query(
                        "SELECT id FROM mat_item_sub_group WHERE code = $1 AND item_group_id = $2 AND id != $3",
                        [code, currentGroupId, subGroupId]
                    );

                    if (existingCode.rows.length > 0) {
                        throw new Error(
                            "Subgroup code already exists within this group"
                        );
                    }
                }

                const now = new Date();
                let query = "UPDATE mat_item_sub_group SET updated_at = $1";
                const params = [now];
                let paramIndex = 2;

                if (code) {
                    query += `, code = $${paramIndex}`;
                    params.push(code);
                    paramIndex++;
                }

                if (name) {
                    query += `, name = $${paramIndex}`;
                    params.push(name);
                    paramIndex++;
                }

                if (item_group_id) {
                    query += `, item_group_id = $${paramIndex}`;
                    params.push(item_group_id);
                    paramIndex++;
                }

                query += ` WHERE id = $${paramIndex} RETURNING id, code, name, item_group_id`;
                params.push(subGroupId);

                const result = await client.query(query, params);

                if (result.rows.length === 0) {
                    throw new Error("Subgroup not found");
                }

                return result.rows[0];
            });
        } catch (error) {
            console.error("Error updating material subgroup:", error);
            throw error;
        }
    },

    // Delete material subgroup
    deleteMaterialSubGroup: async subGroupId => {
        try {
            return await DBClientWrapper(async client => {
                // Begin transaction
                await client.query("BEGIN");

                try {
                    // Check if subgroup has materials
                    const materialsCheck = await client.query(
                        "SELECT id FROM mat_sap_data WHERE material_sub_group_id = $1 LIMIT 1",
                        [subGroupId]
                    );

                    if (materialsCheck.rows.length > 0) {
                        throw new Error(
                            "Cannot delete subgroup with existing materials"
                        );
                    }

                    // Delete the subgroup
                    const result = await client.query(
                        "DELETE FROM mat_item_sub_group WHERE id = $1 RETURNING id",
                        [subGroupId]
                    );

                    if (result.rows.length === 0) {
                        throw new Error("Subgroup not found");
                    }

                    // Commit transaction
                    await client.query("COMMIT");

                    return { id: subGroupId, deleted: true };
                } catch (error) {
                    // Rollback transaction on error
                    await client.query("ROLLBACK");
                    throw error;
                }
            });
        } catch (error) {
            console.error("Error deleting material subgroup:", error);
            throw error;
        }
    },

    // Get subgroups by group ID
    getMaterialSubGroups: async (
        groupId,
        page = 1,
        pageSize = 10,
        searchQuery = ""
    ) => {
        try {
            return await DBClientWrapper(async client => {
                const offset = (page - 1) * pageSize;
                const searchPattern = searchQuery ? `%${searchQuery}%` : null;

                // Build the where clause based on whether we have a search query
                let whereClause = "mis.item_group_id = $1";
                let countWhereClause = "mis.item_group_id = $1";
                let params = [groupId];
                let countParams = [groupId];

                if (searchPattern) {
                    whereClause +=
                        " AND (mis.code ILIKE $4 OR mis.name ILIKE $4)";
                    countWhereClause +=
                        " AND (mis.code ILIKE $2 OR mis.name ILIKE $2)";
                    params.push(pageSize, offset, searchPattern);
                    countParams.push(searchPattern);
                } else {
                    params.push(pageSize, offset);
                }

                // First get the total count with search filter if provided
                const countQuery = await client.query(
                    `
                    SELECT COUNT(*) as total
                    FROM mat_item_sub_group mis
                    WHERE ${countWhereClause}
                    `,
                    countParams
                );

                const totalCount = parseInt(countQuery.rows[0].total);
                const totalPages = Math.ceil(totalCount / pageSize);

                // Get the subgroups with pagination and search filter if provided
                const result = await client.query(
                    `
                    SELECT
                        mis.id,
                        mis.code,
                        mis.name,
                        mis.item_group_id,
                        mig.code as groupCode,
                        mig.name as groupName,
                        (SELECT COUNT(*) FROM mat_sap_data WHERE material_sub_group_id = mis.id) as materials_count
                    FROM mat_item_sub_group mis
                    JOIN mat_item_group mig ON mis.item_group_id = mig.id
                    WHERE ${whereClause}
                    ORDER BY mis.code
                    LIMIT $2 OFFSET $3
                `,
                    params
                );

                return {
                    data: result.rows,
                    pagination: {
                        totalCount,
                        totalPages,
                    },
                };
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    // Get materials by group ID
    getMaterialsByGroup: async (groupId, page = 1, pageSize = 10) => {
        try {
            return await DBClientWrapper(async client => {
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

                // Get group info
                const groupQuery = await client.query(
                    `SELECT id, code, name FROM mat_item_group WHERE id = $1`,
                    [groupId]
                );
                const groupDetails = groupQuery.rows[0] || null;

                // Get materials without attachments first
                const materialsQuery = await client.query(
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
                        mis.code as "subGroupCode",
                        mis.name as "subGroupName",
                        mig.code as "groupCode",
                        mig.name as "groupName",
                        m.code as "fullCode"
                    FROM mat_sap_data m
                    JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                    JOIN mat_item_group mig ON mis.item_group_id = mig.id
                    WHERE mig.id = $1
                    ORDER BY m.name
                    LIMIT $2 OFFSET $3
                    `,
                    [groupId, pageSize, offset]
                );

                // Get all material IDs to fetch attachments
                const materialIds = materialsQuery.rows.map(m => m.id);

                // Get attachments for these materials in a separate query
                const attachmentsQuery = await client.query(
                    `SELECT material_id, id, attachment, type
                     FROM mat_attachment
                     WHERE material_id = ANY($1)`,
                    [materialIds]
                );

                // Create a map of attachments by material_id
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

                // Add attachments to each material
                const materialsWithAttachments = materialsQuery.rows.map(
                    material => ({
                        ...material,
                        attachments: attachmentsByMaterialId[material.id] || [],
                    })
                );

                return {
                    materials: materialsWithAttachments,
                    group: groupDetails,
                    pagination: {
                        page,
                        pageSize,
                        totalCount,
                        totalPages,
                    },
                };
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    // Get materials by subgroup ID
    getMaterialsBySubGroup: async (
        subGroupId,
        page = 1,
        pageSize = 10,
        searchQuery = ""
    ) => {
        try {
            return await DBClientWrapper(async client => {
                const offset = (page - 1) * pageSize;
                const searchPattern = searchQuery ? `%${searchQuery}%` : null;

                // Build where clause and params based on search query
                let whereClause = "m.material_sub_group_id = $1";
                let countWhereClause = "m.material_sub_group_id = $1";
                let countParams = [subGroupId];
                let materialParams = [subGroupId, pageSize, offset];

                if (searchPattern) {
                    countWhereClause +=
                        " AND (m.name ILIKE $2 OR m.description ILIKE $2 OR m.code ILIKE $2 OR COALESCE(m.alias1, '') ILIKE $2 OR COALESCE(m.alias2, '') ILIKE $2 OR COALESCE(m.alias3, '') ILIKE $2)";
                    whereClause +=
                        " AND (m.name ILIKE $4 OR m.description ILIKE $4 OR m.code ILIKE $4 OR COALESCE(m.alias1, '') ILIKE $4 OR COALESCE(m.alias2, '') ILIKE $4 OR COALESCE(m.alias3, '') ILIKE $4)";
                    countParams.push(searchPattern);
                    materialParams.push(searchPattern);
                }

                // First get the total count
                const countQuery = await client.query(
                    `
                    SELECT COUNT(*) as total
                    FROM mat_sap_data m
                    WHERE ${countWhereClause}
                    `,
                    countParams
                );

                const totalCount = parseInt(countQuery.rows[0].total);
                const totalPages = Math.ceil(totalCount / pageSize);

                // Get subgroup and group info
                const groupInfoQuery = await client.query(
                    `
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
                    `,
                    [subGroupId]
                );

                // Build group and subgroup objects
                const groupInfo = groupInfoQuery.rows[0] || null;

                let group = null;
                let subgroup = null;

                if (groupInfo) {
                    group = {
                        id: groupInfo.group_id,
                        code: groupInfo.group_code,
                        name: groupInfo.group_name,
                    };

                    subgroup = {
                        id: groupInfo.id,
                        code: groupInfo.subgroup_code,
                        name: groupInfo.subgroup_name,
                        item_group_id: groupInfo.item_group_id,
                    };
                }

                // Get materials with search and pagination
                const materialsQuery = await client.query(
                    `
                    SELECT
                        m.id,
                        m.code,
                        m.name,
                        m.description,
                        m.long_text,
                        CASE
                            WHEN m.description IS NOT NULL AND m.long_text IS NOT NULL THEN CONCAT(m.description, ' - ', m.long_text)
                            WHEN m.description IS NOT NULL THEN m.description
                            WHEN m.long_text IS NOT NULL THEN m.long_text
                            ELSE NULL
                        END as combined_description,
                        m.alias1,
                        m.alias2,
                        m.alias3,
                        m.filter_code_1,
                        m.filter_code_2,
                        m.created_at,
                        m.updated_at,
                        m.dfFromClient,
                        mis.code as "subGroupCode",
                        mis.name as "subGroupName",
                        mig.code as "groupCode",
                        mig.name as "groupName",
                        m.code as "fullCode"
                    FROM mat_sap_data m
                    JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                    JOIN mat_item_group mig ON mis.item_group_id = mig.id
                    WHERE ${whereClause}
                    ORDER BY m.name
                    LIMIT $2 OFFSET $3
                    `,
                    materialParams
                );

                // Get all material IDs to fetch attachments
                const materialIds = materialsQuery.rows.map(m => m.id);

                // Skip attachment query if no materials
                if (materialIds.length === 0) {
                    return {
                        materials: [],
                        group,
                        subgroup,
                        pagination: {
                            page,
                            pageSize,
                            totalCount,
                            totalPages,
                        },
                    };
                }

                // Get attachments for these materials in a separate query
                const attachmentsQuery = await client.query(
                    `SELECT material_id, id, attachment, type
                     FROM mat_attachment
                     WHERE material_id = ANY($1)`,
                    [materialIds]
                );

                // Create a map of attachments by material_id
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

                // Add attachments to each material
                const materialsWithAttachments = materialsQuery.rows.map(
                    material => ({
                        ...material,
                        attachments: attachmentsByMaterialId[material.id] || [],
                    })
                );

                return {
                    materials: materialsWithAttachments,
                    group,
                    subgroup,
                    pagination: {
                        page,
                        pageSize,
                        totalCount,
                        totalPages,
                    },
                };
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    // Improved search function with unified ranking logic and reusable attachment query
    searchMaterials: async (searchTerm, page = 1, pageSize = 10) => {
        try {
            return await DBClientWrapper(async client => {
                const offset = (page - 1) * pageSize;
                const safeSearchTerm = String(searchTerm || "").trim();

                // Format to full-text search
                const toTsQuery = input =>
                    input
                        .trim()
                        .split(/\s+/)
                        .map(word => `${word}:*`)
                        .join(" & ");

                // Determine if search is active
                const isSearch = safeSearchTerm.length > 0;
                const tsQuery = toTsQuery(safeSearchTerm);
                const ilikeExact = safeSearchTerm;
                const ilikePartial = `%${safeSearchTerm}%`;

                let totalCount = 0;
                let materialsQueryResult = [];

                if (isSearch) {
                    const countRes = await client.query(
                        `SELECT COUNT(*) AS total
                        FROM mat_sap_data m
                        WHERE to_tsvector('english', COALESCE(m.name, '') || ' ' || COALESCE(m.description, '') || ' ' || COALESCE(m.long_text, '') || ' ' || COALESCE(m.alias1, '') || ' ' || COALESCE(m.alias2, '') || ' ' || COALESCE(m.alias3, '') || ' ' || COALESCE(m.code, '')) @@ to_tsquery('english', $1)
                        OR m.code ILIKE $2`,
                        [tsQuery, ilikePartial]
                    );
                    totalCount = parseInt(countRes.rows[0].total);

                    const result = await client.query(
                        `SELECT
                            m.id,
                            m.code,
                            m.name,
                            m.description,
                            m.long_text,
                            CASE
                                WHEN m.description IS NOT NULL AND m.long_text IS NOT NULL THEN CONCAT(m.description, ' - ', m.long_text)
                                WHEN m.description IS NOT NULL THEN m.description
                                WHEN m.long_text IS NOT NULL THEN m.long_text
                                ELSE NULL
                            END AS combined_description,
                            m.alias1,
                            m.alias2,
                            m.alias3,
                            m.filter_code_1,
                            m.filter_code_2,
                            m.material_sub_group_id,
                            m.created_at,
                            m.updated_at,
                            m.dfFromClient,
                            mis.code AS "subGroupCode",
                            mis.name AS "subGroupName",
                            mig.code AS "groupCode",
                            mig.name AS "groupName",
                            ts_rank_cd(
                                setweight(to_tsvector(COALESCE(m.name, '')), 'A') ||
                                setweight(to_tsvector(COALESCE(m.description, '')), 'B') ||
                                setweight(to_tsvector(COALESCE(m.long_text, '')), 'C') ||
                                setweight(to_tsvector(COALESCE(m.alias1, '')), 'D'),
                                to_tsquery('english', $1)
                            ) AS rank,
                            CASE
                                WHEN m.code ILIKE $2 THEN 1
                                WHEN m.code ILIKE $3 THEN 2
                                ELSE 3
                            END AS code_match_rank
                            FROM mat_sap_data m
                            JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                            JOIN mat_item_group mig ON mis.item_group_id = mig.id
                            WHERE to_tsvector('english', COALESCE(m.name, '') || ' ' || COALESCE(m.description, '') || ' ' || COALESCE(m.long_text, '') || ' ' || COALESCE(m.alias1, '') || ' ' || COALESCE(m.alias2, '') || ' ' || COALESCE(m.alias3, '') || ' ' || COALESCE(m.code, '')) @@ to_tsquery('english', $1)
                            OR m.code ILIKE $2
                            ORDER BY code_match_rank, rank DESC, m.name ASC
                            LIMIT $4 OFFSET $5`,
                        [tsQuery, ilikeExact, ilikePartial, pageSize, offset]
                    );

                    materialsQueryResult = result.rows;
                } else {
                    const countRes = await client.query(
                        `SELECT COUNT(*) AS total FROM mat_sap_data`
                    );
                    totalCount = parseInt(countRes.rows[0].total);

                    const result = await client.query(
                        `SELECT
                            m.id,
                            m.code,
                            m.name,
                            m.description,
                            m.long_text,
                            CASE
                                WHEN m.description IS NOT NULL AND m.long_text IS NOT NULL THEN CONCAT(m.description, ' - ', m.long_text)
                                WHEN m.description IS NOT NULL THEN m.description
                                WHEN m.long_text IS NOT NULL THEN m.long_text
                                ELSE NULL
                            END AS combined_description,
                            m.alias1,
                            m.alias2,
                            m.alias3,
                            m.filter_code_1,
                            m.filter_code_2,
                            m.material_sub_group_id,
                            m.created_at,
                            m.updated_at,
                            m.dfFromClient,
                            mis.code AS "subGroupCode",
                            mis.name AS "subGroupName",
                            mig.code AS "groupCode",
                            mig.name AS "groupName"
                            FROM mat_sap_data m
                            JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                            JOIN mat_item_group mig ON mis.item_group_id = mig.id
                            ORDER BY m.code ASC, m.name ASC
                            LIMIT $1 OFFSET $2`,
                        [pageSize, offset]
                    );

                    materialsQueryResult = result.rows;
                }

                const materialIds = materialsQueryResult.map(m => m.id);
                const attachmentsMap =
                    await Material.getAttachmentsByMaterialIds(
                        client,
                        materialIds
                    );

                const finalMaterials = materialsQueryResult.map(material => ({
                    ...material,
                    attachments: attachmentsMap[material.id] || [],
                }));

                return {
                    materials: finalMaterials,
                    pagination: {
                        page,
                        pageSize,
                        totalCount,
                        totalPages: Math.ceil(totalCount / pageSize),
                    },
                };
            });
        } catch (error) {
            console.error("Search error:", error);
            throw error;
        }
    },

    // Utility: Fetch and group attachments
    getAttachmentsByMaterialIds: async (client, ids) => {
        if (!ids.length) return {};
        const res = await client.query(
            `SELECT material_id, id, attachment, type FROM mat_attachment WHERE material_id = ANY($1)`,
            [ids]
        );
        const map = {};
        res.rows.forEach(({ material_id, ...rest }) => {
            if (!map[material_id]) map[material_id] = [];
            map[material_id].push(rest);
        });
        return map;
    },

    // Get material by ID with full details
    getMaterialById: async materialId => {
        try {
            return await DBClientWrapper(async client => {
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
                        m.code as "fullCode"
                    FROM mat_sap_data m
                    JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                    JOIN mat_item_group mig ON mis.item_group_id = mig.id
                    WHERE m.id = $1
                `,
                    [materialId]
                );
                return result.rows[0];
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    getMaterialAttachments: async materialId => {
        try {
            return await DBClientWrapper(async client => {
                const result = await client.query(
                    `SELECT id, attachment, type, material_id
                    FROM mat_attachment
                    WHERE material_id = $1
                    ORDER BY id`,
                    [materialId]
                );
                return result.rows;
            });
        } catch (error) {
            console.error("Error fetching material attachments:", error);
            throw error;
        }
    },

    addAttachment: async (materialId, fileInfoArray, updatedBy) => {
        const uploadedFiles = [];
        const cleanupFiles = [];

        try {
            return await DBClientWrapper(async client => {
                await client.query("BEGIN");

                try {
                    // Check current attachment count
                    const attachmentCountQuery = await client.query(
                        "SELECT COUNT(*) as count FROM mat_attachment WHERE material_id = $1",
                        [materialId]
                    );

                    const currentAttachmentCount = parseInt(
                        attachmentCountQuery.rows[0].count
                    );
                    const MAX_ATTACHMENTS = 3;

                    if (currentAttachmentCount >= MAX_ATTACHMENTS) {
                        throw new Error(
                            `Maximum number of attachments (${MAX_ATTACHMENTS}) reached for this material`
                        );
                    }

                    // Calculate how many more attachments we can add
                    const availableSlots =
                        MAX_ATTACHMENTS - currentAttachmentCount;

                    if (fileInfoArray.length > availableSlots) {
                        throw new Error(
                            `Can only add ${availableSlots} more attachment(s). Maximum of ${MAX_ATTACHMENTS} attachments allowed per material.`
                        );
                    }

                    // 1. Add attachments to database
                    for (const file of fileInfoArray) {
                        // Determine MIME type from extension
                        const mimeType = getMimeType(file.extension);

                        // Use Crud helper to generate insert query
                        const insertData = {
                            material_id: materialId,
                            attachment: file.newName,
                            type: mimeType,
                            created_at: "NOW()",
                            updated_at: "NOW()",
                        };

                        const [query, values] = Crud.insertItem(
                            "mat_attachment",
                            insertData,
                            "id"
                        );

                        const result = await client.query(query, values);

                        uploadedFiles.push({
                            id: result.rows[0].id,
                            originalName: file.originalName,
                            savedAs: file.newName,
                            type: mimeType,
                        });
                    }

                    const updateData = {
                        updated_at: "NOW()",
                        updated_by: updatedBy || null,
                    };

                    const whereCondition = {
                        id: materialId,
                    };

                    const [query, values] = Crud.updateItem(
                        "mat_sap_data",
                        updateData,
                        whereCondition
                    );

                    await client.query(query, values);

                    // Commit transaction
                    await client.query("COMMIT");

                    // 3. After successful database operations, save files to disk
                    for (const file of fileInfoArray) {
                        const publicDir = path.join(
                            path.resolve(),
                            "./backend/public"
                        );

                        // Ensure public directory exists
                        if (!fs.existsSync(publicDir)) {
                            fs.mkdirSync(publicDir, { recursive: true });
                        }

                        const finalPath = path.join(publicDir, file.newName);
                        cleanupFiles.push(finalPath);

                        // Read from temp location and write to final location
                        const rawData = fs.readFileSync(file.tempPath);
                        fs.writeFileSync(finalPath, rawData);
                    }

                    return {
                        success: true,
                        files: uploadedFiles,
                    };
                } catch (error) {
                    // Rollback transaction on error
                    await client.query("ROLLBACK");

                    for (const filePath of cleanupFiles) {
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    }

                    throw error;
                }
            });
        } catch (error) {
            console.error("Error processing attachment upload:", error);
            throw error;
        }
    },

    updateMaterialTimestamp: async (materialId, updatedBy) => {
        try {
            return await DBClientWrapper(async client => {
                // Create data object for update
                const updateData = {
                    updated_at: "NOW()",
                    updated_by: updatedBy || null,
                };

                // Create where condition
                const whereCondition = {
                    id: materialId,
                };

                // Use Crud helper to generate query
                const [query, values] = Crud.updateItem(
                    "mat_sap_data",
                    updateData,
                    whereCondition
                );

                const result = await client.query(query, values);

                if (result.rowCount === 0) {
                    throw new Error("Material not found or no changes made");
                }

                return {
                    materialId,
                    updatedBy: updatedBy || null,
                    updated: true,
                };
            });
        } catch (error) {
            console.error("Error updating material timestamp:", error);
            throw error;
        }
    },

    updateAliasesOnly: async (materialId, alias1, alias2, alias3) => {
        try {
            return await DBClientWrapper(async client => {
                // Create data object for update
                const updateData = {
                    alias1: alias1 || null,
                    alias2: alias2 || null,
                    alias3: alias3 || null,
                };

                // Create where condition
                const whereCondition = {
                    id: materialId,
                };

                // Use Crud helper to generate query
                const [query, values] = Crud.updateItem(
                    "mat_sap_data",
                    updateData,
                    whereCondition
                );

                const result = await client.query(query, values);

                if (result.rowCount === 0) {
                    throw new Error("Material not found or no changes made");
                }

                return {
                    materialId,
                    alias1: alias1 || null,
                    alias2: alias2 || null,
                    alias3: alias3 || null,
                    updated: true,
                };
            });
        } catch (error) {
            console.error("Error updating aliases:", error);
            throw error;
        }
    },

    deleteAttachment: async (attachmentId, updatedBy) => {
        try {
            return await DBClientWrapper(async client => {
                // Begin transaction
                await client.query("BEGIN");

                try {
                    // Get attachment details to get the file path
                    const attachmentQuery = await client.query(
                        "SELECT id, material_id, attachment FROM mat_attachment WHERE id = $1",
                        [attachmentId]
                    );

                    if (attachmentQuery.rows.length === 0) {
                        throw new Error("Attachment not found");
                    }

                    const attachment = attachmentQuery.rows[0];
                    const materialId = attachment.material_id;
                    const filename = attachment.attachment;

                    // Delete the attachment from the database
                    await client.query(
                        "DELETE FROM mat_attachment WHERE id = $1",
                        [attachmentId]
                    );

                    // Update the material's updated_at timestamp
                    await client.query(
                        "UPDATE mat_sap_data SET updated_at = NOW(), updated_by = $1 WHERE id = $2",
                        [updatedBy || null, materialId]
                    );

                    // Commit transaction
                    await client.query("COMMIT");

                    // Try to delete the file from disk (but don't fail if this fails)
                    try {
                        const publicDir = path.join(
                            path.resolve(),
                            "./backend/public"
                        );
                        const filePath = path.join(publicDir, filename);

                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    } catch (fileError) {
                        console.error(
                            "Error deleting attachment file:",
                            fileError
                        );
                        // Don't throw here, we've already committed the DB changes
                    }

                    return {
                        success: true,
                        materialId,
                        attachmentId,
                    };
                } catch (error) {
                    // Rollback transaction on error
                    await client.query("ROLLBACK");
                    throw error;
                }
            });
        } catch (error) {
            console.error("Error deleting attachment:", error);
            throw error;
        }
    },

    // Export only groups to Excel
    exportOnlyGroupsToExcel: async () => {
        try {
            return await DBClientWrapper(async client => {
                // Query to get all groups
                const groupsResult = await client.query(`
                    SELECT
                        id,
                        code as group_code,
                        name as group_name
                    FROM mat_item_group
                    ORDER BY code
                `);

                // Create the export data for the "Groups" sheet
                const groupsData = groupsResult.rows.map(group => ({
                    "Group Code": group.group_code,
                    "Group Name": group.group_name,
                }));

                // Create a new workbook
                const workbook = xlsx.utils.book_new();

                // Add Groups worksheet
                const groupsWorksheet = xlsx.utils.json_to_sheet(groupsData);
                xlsx.utils.book_append_sheet(
                    workbook,
                    groupsWorksheet,
                    "Groups"
                );

                // Create buffer
                const buffer = xlsx.write(workbook, {
                    type: "buffer",
                    bookType: "xlsx",
                });

                return buffer;
            });
        } catch (error) {
            console.error("Error exporting groups to Excel:", error);
            throw error;
        }
    },

    // Export only subgroups to Excel
    exportOnlySubgroupsToExcel: async (groupId = null) => {
        try {
            return await DBClientWrapper(async client => {
                // Build the query based on whether we have a group ID
                let queryText;
                let queryParams = [];

                if (groupId) {
                    queryText = `
                        SELECT
                            s.id,
                            s.code as subgroup_code,
                            s.name as subgroup_name,
                            s.item_group_id,
                            g.code as group_code,
                            g.name as group_name
                        FROM mat_item_sub_group s
                        JOIN mat_item_group g ON s.item_group_id = g.id
                        WHERE s.item_group_id = $1
                        ORDER BY s.code
                    `;
                    queryParams.push(groupId);
                } else {
                    queryText = `
                        SELECT
                            s.id,
                            s.code as subgroup_code,
                            s.name as subgroup_name,
                            s.item_group_id,
                            g.code as group_code,
                            g.name as group_name
                        FROM mat_item_sub_group s
                        JOIN mat_item_group g ON s.item_group_id = g.id
                        ORDER BY g.code, s.code
                    `;
                }

                const subgroupsResult = await client.query(
                    queryText,
                    queryParams
                );

                // Create the export data for the "Subgroups" sheet
                const subgroupsData = subgroupsResult.rows.map(subgroup => ({
                    "Subgroup Code": subgroup.subgroup_code,
                    "Subgroup Name": subgroup.subgroup_name,
                    "Group Code": subgroup.group_code,
                    "Group Name": subgroup.group_name,
                }));

                // Create a new workbook
                const workbook = xlsx.utils.book_new();

                // Add Subgroups worksheet
                const subgroupsWorksheet =
                    xlsx.utils.json_to_sheet(subgroupsData);
                xlsx.utils.book_append_sheet(
                    workbook,
                    subgroupsWorksheet,
                    "Subgroups"
                );

                // Create buffer
                const buffer = xlsx.write(workbook, {
                    type: "buffer",
                    bookType: "xlsx",
                });

                return buffer;
            });
        } catch (error) {
            console.error("Error exporting subgroups to Excel:", error);
            throw error;
        }
    },

    // Import only groups from Excel
    importOnlyGroupsFromExcel: async (fileBuffer, userId) => {
        let client;
        try {
            // Get a client from the pool directly instead of using DBClientWrapper
            client = await db.connect();

            // Begin transaction
            await client.query("BEGIN");

            try {
                // Parse Excel file
                const workbook = xlsx.read(fileBuffer, { type: "buffer" });

                // Check if Groups sheet exists
                if (!workbook.SheetNames.includes("Groups")) {
                    throw new Error("Excel file must contain a 'Groups' sheet");
                }

                // Get Groups sheet data
                const groupsSheet = workbook.Sheets["Groups"];
                const groupsData = xlsx.utils.sheet_to_json(groupsSheet);

                // Statistics for operation
                const stats = {
                    total: groupsData.length,
                    created: 0,
                    updated: 0,
                    skipped: 0,
                    errors: [],
                };

                // Process each group in a try-catch block to prevent one error from failing the entire transaction
                for (const group of groupsData) {
                    try {
                        // Try multiple possible column naming formats since Excel exports can be inconsistent
                        // Check if column name is different than expected
                        const code = String(
                            group["Group Code"] ||
                                group["group_code"] ||
                                group["GroupCode"] ||
                                group["groupCode"] ||
                                group["group code"] ||
                                group["code"] ||
                                ""
                        ).trim();

                        const name = String(
                            group["Group Name"] ||
                                group["group_name"] ||
                                group["GroupName"] ||
                                group["groupName"] ||
                                group["group name"] ||
                                group["name"] ||
                                ""
                        ).trim();

                        // Skip empty rows
                        if (!code && !name) {
                            stats.skipped++;
                            continue;
                        }

                        // Validate required fields
                        if (!code || !name) {
                            throw new Error(
                                `Missing required fields. Group Code: ${code}, Group Name: ${name}`
                            );
                        }

                        // Check if group already exists
                        const existingGroup = await client.query(
                            "SELECT id FROM mat_item_group WHERE code = $1",
                            [code]
                        );

                        const now = new Date();

                        if (existingGroup.rows.length > 0) {
                            // Update existing group
                            const groupId = existingGroup.rows[0].id;
                            await client.query(
                                `UPDATE mat_item_group
                                SET name = $1, updated_at = $2, updated_by = $3
                                WHERE id = $4`,
                                [name, now, userId, groupId]
                            );
                            stats.updated++;
                        } else {
                            await client.query(
                                `INSERT INTO mat_item_group (code, name, created_at, updated_at, created_by, updated_by)
                                VALUES ($1, $2, $3, $4, $5, $6)
                                RETURNING id`,
                                [code, name, now, now, userId, userId]
                            );
                            stats.created++;
                        }
                    } catch (error) {
                        // Log the error but continue processing other groups
                        stats.errors.push({
                            row: JSON.stringify(group),
                            error: error.message,
                        });
                    }
                }

                // Commit transaction only if there were no errors or if some records were successful
                if (
                    stats.errors.length === 0 ||
                    stats.created > 0 ||
                    stats.updated > 0
                ) {
                    await client.query("COMMIT");
                } else {
                    // Rollback if nothing was processed successfully
                    await client.query("ROLLBACK");
                }

                return stats;
            } catch (error) {
                // Ensure rollback happens on any error
                if (client) {
                    await client.query("ROLLBACK");
                }
                throw error;
            }
        } catch (error) {
            throw error;
        } finally {
            // Always release the client back to the pool
            if (client) {
                client.release();
            }
        }
    },

    // Import only subgroups from Excel
    importOnlySubgroupsFromExcel: async (fileBuffer, userId) => {
        let client;
        try {
            // Get a client from the pool directly instead of using DBClientWrapper
            client = await db.connect();

            // Begin transaction
            await client.query("BEGIN");

            try {
                // Parse Excel file
                const workbook = xlsx.read(fileBuffer, { type: "buffer" });

                // Check if Subgroups sheet exists
                if (!workbook.SheetNames.includes("Subgroups")) {
                    throw new Error(
                        "Excel file must contain a 'Subgroups' sheet"
                    );
                }

                // Get Subgroups sheet data
                const subgroupsSheet = workbook.Sheets["Subgroups"];
                const subgroupsData = xlsx.utils.sheet_to_json(subgroupsSheet);

                // Statistics for operation
                const stats = {
                    total: subgroupsData.length,
                    created: 0,
                    updated: 0,
                    skipped: 0,
                    errors: [],
                };

                // Get all existing groups for validation
                const groupsResult = await client.query(
                    "SELECT id, code FROM mat_item_group"
                );
                const groupCodeToIdMap = new Map();
                groupsResult.rows.forEach(group => {
                    groupCodeToIdMap.set(group.code, group.id);
                });

                // Process each subgroup in a try-catch block to prevent one error from failing the entire transaction
                for (const subgroup of subgroupsData) {
                    try {
                        // Extract and validate data
                        const code = String(
                            subgroup["Subgroup Code"] || ""
                        ).trim();
                        const name = String(
                            subgroup["Subgroup Name"] || ""
                        ).trim();
                        const groupCode = String(
                            subgroup["Group Code"] || ""
                        ).trim();

                        // Skip empty rows
                        if (!code && !name) {
                            stats.skipped++;
                            continue;
                        }

                        // Validate required fields
                        if (!code || !name || !groupCode) {
                            throw new Error(
                                `Missing required fields. Subgroup Code: ${code}, Subgroup Name: ${name}, Group Code: ${groupCode}`
                            );
                        }

                        // Find the group ID from the map
                        if (!groupCodeToIdMap.has(groupCode)) {
                            throw new Error(
                                `Group with code ${groupCode} not found. Make sure it exists in the database before importing subgroups.`
                            );
                        }

                        const groupId = groupCodeToIdMap.get(groupCode);

                        // Check if subgroup already exists in this group
                        const existingSubgroup = await client.query(
                            "SELECT id FROM mat_item_sub_group WHERE code = $1 AND item_group_id = $2",
                            [code, groupId]
                        );

                        const now = new Date();

                        if (existingSubgroup.rows.length > 0) {
                            // Update existing subgroup
                            const subgroupId = existingSubgroup.rows[0].id;
                            await client.query(
                                `UPDATE mat_item_sub_group
                                SET name = $1, updated_at = $2, updated_by = $3
                                WHERE id = $4`,
                                [name, now, userId, subgroupId]
                            );
                            stats.updated++;
                        } else {
                            // Create new subgroup
                            await client.query(
                                `INSERT INTO mat_item_sub_group (code, name, item_group_id, created_at, updated_at, created_by, updated_by)
                                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                                [code, name, groupId, now, now, userId, userId]
                            );
                            stats.created++;
                        }
                    } catch (error) {
                        // Log the error but continue processing other subgroups
                        stats.errors.push({
                            row: JSON.stringify(subgroup),
                            error: error.message,
                        });
                    }
                }

                // Commit transaction only if there were no errors or if some records were successful
                if (
                    stats.errors.length === 0 ||
                    stats.created > 0 ||
                    stats.updated > 0
                ) {
                    await client.query("COMMIT");
                } else {
                    // Rollback if nothing was processed successfully
                    await client.query("ROLLBACK");
                }

                return stats;
            } catch (error) {
                // Ensure rollback happens on any error
                if (client) {
                    try {
                        await client.query("ROLLBACK");
                    } catch (rollbackError) {
                        console.error("Error during rollback:", rollbackError);
                    }
                }
                throw error;
            }
        } catch (error) {
            console.error("Error importing subgroups from Excel:", error);
            throw error;
        } finally {
            // Always release the client back to the pool
            if (client) {
                client.release();
            }
        }
    },
};

module.exports = Material;
