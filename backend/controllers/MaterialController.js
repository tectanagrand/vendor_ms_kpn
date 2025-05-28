const Material = require("../models/MaterialModel");
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const os = require("os");

const MaterialController = {
    // Get all material groups
    getMaterialGroups: async (req, res) => {
        try {
            const result = await Material.getMaterialGroups();
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch material groups",
                error: error.message,
            });
        }
    },

    // Get subgroups by group ID
    getMaterialSubGroups: async (req, res) => {
        try {
            const { groupId } = req.params;
            const result = await Material.getMaterialSubGroups(groupId);
            res.status(200).json({
                success: true,
                data: result,
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

            const result = await Material.getMaterialsBySubGroup(
                subGroupId,
                page,
                pageSize
            );
            res.status(200).json({
                success: true,
                data: result.materials,
                subGroup: result.subGroup,
                group: result.group,
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
};

module.exports = MaterialController;
