const Material = require("../models/MaterialModel");
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
const pool = require("../config/connection");
const saveToDatabase = require("../helper/sap_seeding");

const MaterialController = {
    // Create a new material group
    createMaterialGroup: async (req, res) => {
        try {
            const { code, name } = req.body;

            // Validate required fields
            if (!code || !name) {
                return res.status(400).json({
                    success: false,
                    message: "Group code and name are required",
                });
            }

            const result = await Material.createMaterialGroup({ code, name });

            res.status(201).json({
                success: true,
                message: "Material group created successfully",
                data: result,
            });
        } catch (error) {
            let statusCode = 500;
            let message = "Failed to create material group";

            if (error.message === "Group code already exists") {
                statusCode = 409;
                message = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message,
                error: error.message,
            });
        }
    },

    // Update a material group
    updateMaterialGroup: async (req, res) => {
        try {
            const { groupId } = req.params;
            const { code, name } = req.body;

            // Validate at least one field to update
            if (!code && !name) {
                return res.status(400).json({
                    success: false,
                    message:
                        "At least one field (code or name) is required for update",
                });
            }

            const result = await Material.updateMaterialGroup(groupId, {
                code,
                name,
            });

            res.status(200).json({
                success: true,
                message: "Material group updated successfully",
                data: result,
            });
        } catch (error) {
            let statusCode = 500;
            let message = "Failed to update material group";

            if (error.message === "Group not found") {
                statusCode = 404;
                message = error.message;
            } else if (error.message === "Group code already exists") {
                statusCode = 409;
                message = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message,
                error: error.message,
            });
        }
    },

    // Delete a material group
    deleteMaterialGroup: async (req, res) => {
        try {
            const { groupId } = req.params;

            const result = await Material.deleteMaterialGroup(groupId);

            res.status(200).json({
                success: true,
                message: "Material group deleted successfully",
                data: result,
            });
        } catch (error) {
            let statusCode = 500;
            let message = "Failed to delete material group";

            if (error.message === "Group not found") {
                statusCode = 404;
                message = error.message;
            } else if (
                error.message === "Cannot delete group with existing subgroups"
            ) {
                statusCode = 400;
                message = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message,
                error: error.message,
            });
        }
    },

    // Create a new material subgroup
    createMaterialSubGroup: async (req, res) => {
        try {
            const { code, name, item_group_id } = req.body;

            // Validate required fields
            if (!code || !name || !item_group_id) {
                return res.status(400).json({
                    success: false,
                    message: "Subgroup code, name, and group ID are required",
                });
            }

            const result = await Material.createMaterialSubGroup({
                code,
                name,
                item_group_id,
            });

            res.status(201).json({
                success: true,
                message: "Material subgroup created successfully",
                data: result,
            });
        } catch (error) {
            let statusCode = 500;
            let message = "Failed to create material subgroup";

            if (error.message === "Parent group not found") {
                statusCode = 404;
                message = error.message;
            } else if (
                error.message ===
                "Subgroup code already exists within this group"
            ) {
                statusCode = 409;
                message = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message,
                error: error.message,
            });
        }
    },

    // Update a material subgroup
    updateMaterialSubGroup: async (req, res) => {
        try {
            const { subGroupId } = req.params;
            const { code, name, item_group_id } = req.body;

            // Validate at least one field to update
            if (!code && !name && !item_group_id) {
                return res.status(400).json({
                    success: false,
                    message:
                        "At least one field (code, name, or group ID) is required for update",
                });
            }

            const result = await Material.updateMaterialSubGroup(subGroupId, {
                code,
                name,
                item_group_id,
            });

            res.status(200).json({
                success: true,
                message: "Material subgroup updated successfully",
                data: result,
            });
        } catch (error) {
            let statusCode = 500;
            let message = "Failed to update material subgroup";

            if (
                error.message === "Subgroup not found" ||
                error.message === "Parent group not found"
            ) {
                statusCode = 404;
                message = error.message;
            } else if (
                error.message ===
                "Subgroup code already exists within this group"
            ) {
                statusCode = 409;
                message = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message,
                error: error.message,
            });
        }
    },

    // Delete a material subgroup
    deleteMaterialSubGroup: async (req, res) => {
        try {
            const { subGroupId } = req.params;

            const result = await Material.deleteMaterialSubGroup(subGroupId);

            res.status(200).json({
                success: true,
                message: "Material subgroup deleted successfully",
                data: result,
            });
        } catch (error) {
            let statusCode = 500;
            let message = "Failed to delete material subgroup";

            if (error.message === "Subgroup not found") {
                statusCode = 404;
                message = error.message;
            } else if (
                error.message ===
                "Cannot delete subgroup with existing materials"
            ) {
                statusCode = 400;
                message = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message,
                error: error.message,
            });
        }
    },

    // Export only groups to Excel
    exportOnlyGroupsToExcel: async (req, res) => {
        try {
            const buffer = await Material.exportOnlyGroupsToExcel();

            // Set headers for Excel file download
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=groups.xlsx"
            );
            res.setHeader("Content-Length", buffer.length);

            // Send the file buffer
            res.send(buffer);
        } catch (error) {
            console.error("Groups Excel export error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to export groups to Excel",
                error: error.message,
            });
        }
    },

    // Export only subgroups to Excel
    exportOnlySubgroupsToExcel: async (req, res) => {
        try {
            const groupId = req.params.groupId || null;
            const buffer = await Material.exportOnlySubgroupsToExcel(groupId);

            // Set filename based on whether we're exporting for a specific group
            const filename = groupId
                ? `subgroups_${groupId}.xlsx`
                : "subgroups.xlsx";

            // Set headers for Excel file download
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${filename}`
            );
            res.setHeader("Content-Length", buffer.length);

            // Send the file buffer
            res.send(buffer);
        } catch (error) {
            console.error("Subgroups Excel export error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to export subgroups to Excel",
                error: error.message,
            });
        }
    },

    // Import only groups from Excel
    importOnlyGroupsFromExcel: async (req, res) => {
        try {
            // Get user ID from session
            const userId = req.cookies.user_id;

            // Parse form with uploaded file
            const form = new formidable.IncomingForm();
            const [fields, items] = await form.parse(req);

            // Get the uploaded file - handle different possible formats from formidable
            const file = items.file?.[0] || items.files?.[0] || null;

            if (!file) {
                console.error("No file found in request:", { fields, items });
                return res.status(400).json({
                    success: false,
                    message:
                        "No file uploaded or file field not found in request",
                });
            }

            // Check file extension
            const fileExtension = path
                .extname(file.originalFilename)
                .toLowerCase();
            if (fileExtension !== ".xlsx" && fileExtension !== ".xls") {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid file format. Please upload an Excel file (.xlsx or .xls)",
                });
            }

            // Read file buffer
            const fileBuffer = fs.readFileSync(file.filepath);

            // Import groups from Excel
            await Material.importOnlyGroupsFromExcel(fileBuffer, userId);

            // Delete temp file
            fs.unlinkSync(file.filepath);

            res.status(200).json({
                success: true,
                message: "Groups imported successfully",
            });
        } catch (error) {
            console.error("Groups Excel import error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to import groups from Excel",
                error: error.message,
            });
        }
    },

    // Import only subgroups from Excel
    importOnlySubgroupsFromExcel: async (req, res) => {
        try {
            // Get user ID from session
            const userId = req.cookies.user_id;

            // Parse form with uploaded file
            const form = new formidable.IncomingForm();
            const [fields, items] = await form.parse(req);

            // Get the uploaded file - handle different possible formats from formidable
            const file = items.file?.[0] || items.files?.[0] || null;

            if (!file) {
                console.error("No file found in request:", { fields, items });
                return res.status(400).json({
                    success: false,
                    message:
                        "No file uploaded or file field not found in request",
                });
            }

            // Check file extension
            const fileExtension = path
                .extname(file.originalFilename)
                .toLowerCase();
            if (fileExtension !== ".xlsx" && fileExtension !== ".xls") {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid file format. Please upload an Excel file (.xlsx or .xls)",
                });
            }

            // Read file buffer
            const fileBuffer = fs.readFileSync(file.filepath);

            // Import subgroups from Excel
            await Material.importOnlySubgroupsFromExcel(fileBuffer, userId);

            // Delete temp file
            fs.unlinkSync(file.filepath);

            res.status(200).json({
                success: true,
                message: "Subgroups imported successfully",
            });
        } catch (error) {
            console.error("Subgroups Excel import error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to import subgroups from Excel",
                error: error.message,
            });
        }
    },

    // Get all material groups
    getMaterialGroups: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const searchQuery = req.query.q || "";

            const result = await Material.getMaterialGroups(
                page,
                pageSize,
                searchQuery
            );
            res.status(200).json({
                success: true,
                data: result.data,
                searchQuery: searchQuery,
                pagination: {
                    page,
                    pageSize,
                    totalCount: result.pagination.totalCount,
                    totalPages: result.pagination.totalPages,
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch material groups",
                error: error.message,
            });
        }
    },

    // Get all material groups for dropdown (no pagination)
    getAllMaterialGroups: async (req, res) => {
        try {
            const result = await Material.getAllMaterialGroups();
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch all material groups",
                error: error.message,
            });
        }
    },

    // Get all subgroups for a group for dropdown (no pagination)
    getAllSubgroupsByGroup: async (req, res) => {
        try {
            const { groupId } = req.params;
            const result = await Material.getAllSubgroupsByGroup(groupId);
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch all subgroups for group",
                error: error.message,
            });
        }
    },

    // Get subgroups by group ID
    getMaterialSubGroups: async (req, res) => {
        try {
            const { groupId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const searchQuery = req.query.q || "";

            const result = await Material.getMaterialSubGroups(
                groupId,
                page,
                pageSize,
                searchQuery
            );
            res.status(200).json({
                success: true,
                data: result.data,
                searchQuery: searchQuery,
                pagination: {
                    page,
                    pageSize,
                    totalCount: result.pagination.totalCount,
                    totalPages: result.pagination.totalPages,
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch material subgroups",
                error: error.message,
            });
        }
    },

    // Get materials by group ID
    getMaterialsByGroup: async (req, res) => {
        try {
            const { groupId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;

            const result = await Material.getMaterialsByGroup(
                groupId,
                page,
                pageSize
            );
            res.status(200).json({
                success: true,
                data: result.materials,
                group: result.group,
                pagination: result.pagination,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch materials by group",
                error: error.message,
            });
        }
    },

    // Get materials by subgroup ID
    getMaterialsBySubGroup: async (req, res) => {
        try {
            const { subGroupId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const searchQuery = req.query.q || "";

            const result = await Material.getMaterialsBySubGroup(
                subGroupId,
                page,
                pageSize,
                searchQuery
            );
            res.status(200).json({
                success: true,
                data: result.materials,
                subGroup: result.subgroup,
                group: result.group,
                searchQuery: searchQuery,
                pagination: result.pagination,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch materials",
                error: error.message,
            });
        }
    },

    // Search materials
    searchMaterials: async (req, res) => {
        try {
            const { q } = req.query;
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;

            // If no search query is provided, get all materials sorted by group
            const searchTerm = q ? q.trim() : "";

            const result = await Material.searchMaterials(
                searchTerm,
                page,
                pageSize
            );

            res.status(200).json({
                success: true,
                data: result.materials,
                searchTerm: searchTerm,
                count: result.materials.length,
                pagination: result.pagination,
                totalCount: result.pagination.totalCount,
            });
        } catch (error) {
            console.error("Search error:", error.message);
            res.status(500).json({
                success: false,
                message: "Failed to search materials",
                error: error.message,
            });
        }
    },

    // Get material by ID with attachments
    getMaterialById: async (req, res) => {
        try {
            const { materialId } = req.params;
            const material = await Material.getMaterialById(materialId);

            if (!material) {
                return res.status(404).json({
                    success: false,
                    message: "Material not found",
                });
            }

            const attachments =
                await Material.getMaterialAttachments(materialId);

            res.status(200).json({
                success: true,
                data: {
                    ...material,
                    attachments,
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch material details",
                error: error.message,
            });
        }
    },

    // Upload attachment for a material
    uploadAttachment: async (req, res) => {
        // Track the temporary files and paths to handle cleanup on failure
        const tempFilePaths = [];

        try {
            const { materialId } = req.params;
            const updatedBy = req.cookies.user_id;

            // Check if material exists
            const material = await Material.getMaterialById(materialId);
            if (!material) {
                return res.status(404).json({
                    success: false,
                    message: "Material not found",
                });
            }

            // Allowed file extensions
            const extensions = ["pdf", "doc", "docx", "png", "jpg", "jpeg"];

            // Configure formidable
            const form = new formidable.IncomingForm();
            form.options.multiples = true;
            form.options.maxFileSize = 5 * 1024 * 1024; // 5MB max file size

            // Store files temporarily but don't move them yet
            const [fields, items] = await form.parse(req);
            const files = items.files || items.file;

            if (!files || files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No files uploaded",
                });
            }

            const filesToProcess = [];

            for (const file of files) {
                try {
                    // Generate timestamp for unique filename
                    const timestamp = Date.now().toString();

                    // Split filename to get extension
                    let name = file.originalFilename.split(".");
                    name[0] = name[0].replace(/ /g, "_");
                    const extension = name[name.length - 1].toLowerCase();

                    // Check if extension is allowed
                    if (!extensions.includes(extension)) {
                        throw new Error("File format invalid");
                    }

                    // Create new filename with timestamp
                    const newName = `${name
                        .slice(0, -1)
                        .join(".")}_${timestamp}.${extension}`;

                    // Save the temporary file path for later
                    tempFilePaths.push(file.filepath);

                    // Add to list of files to process (let model determine MIME type)
                    filesToProcess.push({
                        tempPath: file.filepath,
                        newName,
                        extension,
                        originalName: file.originalFilename,
                    });
                } catch (error) {
                    if (error.message === "File format invalid") {
                        return res.status(400).json({
                            success: false,
                            message:
                                "Invalid file format. Please upload files with valid extensions: " +
                                extensions.join(", "),
                        });
                    }
                    throw error;
                }
            }

            // Use the addAttachment method that handles both database and file operations
            const result = await Material.addAttachment(
                materialId,
                filesToProcess,
                updatedBy
            );

            res.status(200).json({
                success: true,
                files: result.files,
            });
        } catch (error) {
            console.error("Upload error:", error);

            if (error.code === 1016) {
                return res.status(400).json({
                    success: false,
                    message: "File size exceeded. Maximum file size is 5MB",
                });
            }

            res.status(500).json({
                success: false,
                message: "Failed to upload attachment",
                error: error.message,
            });
        }
    },

    // Update material aliases
    updateAliases: async (req, res) => {
        try {
            const { materialId } = req.params;
            const { alias1, alias2, alias3 } = req.body;

            const updatedBy = req.cookies.user_id;

            // Check if material exists
            const material = await Material.getMaterialById(materialId);
            if (!material) {
                return res.status(404).json({
                    success: false,
                    message: "Material not found",
                });
            }

            // Update aliases without updating timestamps
            const result = await Material.updateAliasesOnly(
                materialId,
                alias1,
                alias2,
                alias3
            );

            // Update timestamps separately
            await Material.updateMaterialTimestamp(materialId, updatedBy);

            res.status(200).json({
                success: true,
                message: "Material aliases updated successfully",
                data: result,
            });
        } catch (error) {
            console.error("Update aliases error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update material aliases",
                error: error.message,
            });
        }
    },

    // Get material attachments
    getMaterialAttachments: async (req, res) => {
        try {
            const { materialId } = req.params;

            // Get attachments for the material
            const attachments =
                await Material.getMaterialAttachments(materialId);

            res.status(200).json({
                success: true,
                data: attachments,
            });
        } catch (error) {
            console.error("Error fetching attachments:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch attachments",
                error: error.message,
            });
        }
    },

    // Serve file from public directory
    serveFile: async (req, res) => {
        try {
            const filename = req.params.filename;
            const filepath = path.join(
                path.resolve(),
                "./backend/public",
                filename
            );

            // Check if file exists
            if (!fs.existsSync(filepath)) {
                return res.status(404).json({
                    success: false,
                    message: "File not found",
                });
            }

            // Get file stats
            const stats = fs.statSync(filepath);

            // Determine content type based on file extension
            const ext = path.extname(filename).toLowerCase();
            let contentType = "application/octet-stream";

            switch (ext) {
                case ".pdf":
                    contentType = "application/pdf";
                    break;
                case ".png":
                    contentType = "image/png";
                    break;
                case ".jpg":
                case ".jpeg":
                    contentType = "image/jpeg";
                    break;
                case ".gif":
                    contentType = "image/gif";
                    break;
                case ".doc":
                case ".docx":
                    contentType = "application/msword";
                    break;
            }

            // Set appropriate headers
            res.setHeader("Content-Type", contentType);
            res.setHeader("Content-Length", stats.size);
            res.setHeader(
                "Content-Disposition",
                `inline; filename="${filename}"`
            );

            // Stream the file
            const fileStream = fs.createReadStream(filepath);
            fileStream.pipe(res);
        } catch (error) {
            console.error("Error serving file:", error);
            res.status(500).json({
                success: false,
                message: "Failed to serve file",
                error: error.message,
            });
        }
    },

    // Delete attachment
    deleteAttachment: async (req, res) => {
        try {
            const { attachmentId } = req.params;
            const updatedBy = req.cookies.user_id;

            const result = await Material.deleteAttachment(
                attachmentId,
                updatedBy
            );

            res.status(200).json({
                success: true,
                message: "Attachment deleted successfully",
                data: result,
            });
        } catch (error) {
            console.error("Error deleting attachment:", error);

            let statusCode = 500;
            let message = "Failed to delete attachment";

            if (error.message === "Attachment not found") {
                statusCode = 404;
                message = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message,
                error: error.message,
            });
        }
    },

    // Get attachments for materials by array of codes
    getAttachmentsByCodes: async (req, res) => {
        try {
            const codes = req.body.codes;
            if (!Array.isArray(codes) || codes.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "'codes' must be a non-empty array.",
                });
            }
            const result = await Material.getAttachmentsByCodes(codes);
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch attachments by codes",
                error: error.message,
            });
        }
    },

    // SAP Data Synchronization endpoint
    syncSAPData: async (req, res) => {
        try {
            const { startDate, endDate, fieldName = "LAEDA" } = req.query;

            // Validate required parameters
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message:
                        "startDate and endDate query parameters are required (format: YYYYMMDD)",
                });
            }

            // Validate fieldName
            if (!["ERSDA", "LAEDA"].includes(fieldName)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "fieldName must be either 'ERSDA' (creation date) or 'LAEDA' (update date)",
                });
            }

            // Validate date format (should be YYYYMMDD)
            const dateRegex = /^\d{8}$/;
            if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
                return res.status(400).json({
                    success: false,
                    message: "Dates must be in YYYYMMDD format",
                });
            }

            console.log(
                `Starting SAP sync: ${fieldName} from ${startDate} to ${endDate}`
            );

            // Configure axios instance with SAP credentials
            const sapClient = axios.create({
                headers: {
                    Authorization: `Basic ${Buffer.from(
                        `${process.env.SAP_USER}:${process.env.SAP_PWD}`
                    ).toString("base64")}`,
                    "Content-Type": "application/json",
                },
                timeout: 30000,
            });

            // Fetch data from SAP
            const SAP_URL = `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZMM_MATERIAL_MASTER_SRV/MATERIALSet?$filter=(${fieldName} gt '${startDate}')and(${fieldName} lt '${endDate}')&$format=json`;

            const response = await sapClient.get(SAP_URL);
            const results = response.data.d.results;

            console.log(`Retrieved ${results.length} records from SAP`);

            // Filter valid items (starting with 9)
            const validItems = [];
            let skippedNotStartsWith9 = 0;

            for (const item of results) {
                if (!item.MATNR.startsWith("9")) {
                    skippedNotStartsWith9++;
                    continue;
                }
                validItems.push(item);
            }

            console.log(
                `Valid items: ${validItems.length}, Skipped: ${skippedNotStartsWith9}`
            );

            // Process database operations
            const dbStats = {
                inserted: 0,
                updated: 0,
                failed: 0,
                total: validItems.length,
            };

            for (const item of validItems) {
                const result = await saveToDatabase(item, pool);

                if (result.success) {
                    if (result.action === "inserted") {
                        dbStats.inserted++;
                    } else {
                        dbStats.updated++;
                    }
                } else {
                    dbStats.failed++;
                    console.error(
                        `Failed: ${result.materialId} - ${result.error}`
                    );
                }
            }

            const successRate = (
                ((dbStats.inserted + dbStats.updated) / dbStats.total) *
                100
            ).toFixed(2);

            res.status(200).json({
                success: true,
                message: "SAP data synchronization completed",
                data: {
                    sapRecords: results.length,
                    validRecords: validItems.length,
                    skippedNotStartsWith9,
                    database: {
                        inserted: dbStats.inserted,
                        updated: dbStats.updated,
                        failed: dbStats.failed,
                        successRate: `${successRate}%`,
                    },
                    parameters: {
                        fieldName,
                        startDate,
                        endDate,
                    },
                },
            });
        } catch (error) {
            console.error("SAP sync error:", error);

            let statusCode = 500;
            let message = "Failed to sync SAP data";

            if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
                statusCode = 503;
                message = "SAP server is not accessible";
            } else if (error.response && error.response.status) {
                statusCode = error.response.status;
                message = `SAP API error: ${error.response.statusText}`;
            }

            res.status(statusCode).json({
                success: false,
                message,
                error: error.message,
            });
        }
    },

    // Export materials to Excel (filtered by group/subgroup)
    exportMaterialsToExcel: async (req, res) => {
        try {
            const groupId = req.query.groupId || null;
            const subGroupId = req.query.subGroupId || null;
            const { buffer, groupCode, subGroupCode } =
                await Material.exportMaterialsToExcel(groupId, subGroupId);

            // Debug logging
            console.log(
                "[ExportExcel] groupId:",
                groupId,
                "subGroupId:",
                subGroupId,
                "groupCode:",
                groupCode,
                "subGroupCode:",
                subGroupCode
            );

            let filename = "materials.xlsx";
            if (groupCode && subGroupCode)
                filename = `materials_group_${groupCode}_subgroup_${subGroupCode}.xlsx`;
            else if (subGroupCode)
                filename = `materials_subgroup_${subGroupCode}.xlsx`;
            else if (groupCode) filename = `materials_group_${groupCode}.xlsx`;

            console.log("[ExportExcel] Final filename:", filename);

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${filename}`
            );
            res.setHeader("Content-Length", buffer.length);
            res.send(buffer);
        } catch (error) {
            console.error("Materials Excel export error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to export materials to Excel",
                error: error.message,
            });
        }
    },
};

module.exports = MaterialController;
