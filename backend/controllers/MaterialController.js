const Material = require("../models/MaterialModel");

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

            if (!q || q.trim() === "") {
                return res.status(400).json({
                    success: false,
                    message: "Search query is required",
                });
            }

            const searchTerm = q.trim();
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
};

module.exports = MaterialController;
