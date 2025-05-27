const db = require("../config/connection.js");
const Crud = require("../helper/crudquery.js");
const fs = require("fs");
const path = require("path");
const DBClientWrapper = require("../helper/DBClientWrapper.js");
const getMimeType = require("../helper/mimetype.js");

const Material = {
    // Get all material groups
    getMaterialGroups: async () => {
        try {
            return await DBClientWrapper(async client => {
                const result = await client.query(`
                    SELECT id, code, name
                    FROM mat_item_group
                    ORDER BY code
                `);
                return result.rows;
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

    // Get subgroups by group ID
    getMaterialSubGroups: async groupId => {
        try {
            return await DBClientWrapper(async client => {
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
                return result.rows;
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    // Get materials by subgroup ID
    getMaterialsBySubGroup: async (subGroupId, page = 1, pageSize = 10) => {
        try {
            return await DBClientWrapper(async client => {
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
                const groupAndSubgroup = groupInfo
                    ? {
                          subGroup: {
                              id: groupInfo.id,
                              code: groupInfo.subgroup_code,
                              name: groupInfo.subgroup_name,
                          },
                          group: {
                              id: groupInfo.group_id,
                              code: groupInfo.group_code,
                              name: groupInfo.group_name,
                          },
                      }
                    : {
                          subGroup: { id: null, code: null, name: null },
                          group: { id: null, code: null, name: null },
                      };

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
                    WHERE m.material_sub_group_id = $1
                    ORDER BY m.name
                    LIMIT $2 OFFSET $3
                    `,
                    [subGroupId, pageSize, offset]
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
                    subGroup: groupAndSubgroup.subGroup,
                    group: groupAndSubgroup.group,
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

    // Search materials by various criteria
    searchMaterials: async (searchTerm, page = 1, pageSize = 10) => {
        try {
            return await DBClientWrapper(async client => {
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

                console.log(
                    "Total count:",
                    totalCount,
                    "Total pages:",
                    totalPages
                );

                // Using ILIKE for case-insensitive searching
                console.log(
                    "Executing search query with ILIKE for case-insensitivity"
                );

                // First, get the materials that match the search term without attachments
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
                    `Found ${materialsQuery.rows.length} materials matching search term (page ${page})`
                );

                // If no materials found, return empty array
                if (materialsQuery.rows.length === 0) {
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

                // Get the material IDs and subgroup IDs
                const materialIds = materialsQuery.rows.map(m => m.id);
                const subGroupIds = materialsQuery.rows.map(
                    m => m.material_sub_group_id
                );

                // Get subgroup and group information
                const groupInfoQuery = await client.query(
                    `
                    SELECT
                        mis.id as subgroup_id,
                        mis.code as "subGroupCode",
                        mis.name as "subGroupName",
                        mig.code as "groupCode",
                        mig.name as "groupName",
                        mig.id as group_id,
                        m.code as "fullCode"
                    FROM mat_item_sub_group mis
                    JOIN mat_item_group mig ON mis.item_group_id = mig.id
                    JOIN mat_sap_data m ON m.material_sub_group_id = mis.id
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
                        fullCode: row.fullCode,
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
                const finalResults = materialsQuery.rows.map(material => {
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

                return {
                    materials: finalResults,
                    pagination: {
                        page,
                        pageSize,
                        totalCount,
                        totalPages,
                    },
                };
            });
        } catch (error) {
            console.error("Search error:", error);
            throw error;
        }
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
};

module.exports = Material;
