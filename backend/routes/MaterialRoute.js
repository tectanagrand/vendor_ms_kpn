const express = require("express");
const router = express.Router();
const MaterialController = require("../controllers/MaterialController");
const AuthToken = require("../middleware/tokenmanager");
// Get all material groups
router.get("/groups", MaterialController.getMaterialGroups);

// Get subgroups by group ID
router.get(
    "/groups/:groupId/subgroups",
    MaterialController.getMaterialSubGroups
);

// Get materials by group ID
router.get(
    "/groups/:groupId/materials",
    MaterialController.getMaterialsByGroup
);

// Get materials by subgroup ID
router.get(
    "/subgroups/:subGroupId/materials",
    MaterialController.getMaterialsBySubGroup
);

// Search materials (query parameter: ?q=searchTerm)
router.get("/search", MaterialController.searchMaterials);

// Get material by ID with full details and attachments
router.get("/:materialId", MaterialController.getMaterialById);

// Get attachments by material ID
router.get(
    "/:materialId/attachments",
    MaterialController.getMaterialAttachments
);

// Upload attachment for a material
router.post(
    "/:materialId/attachments",
    AuthToken.authSession,
    MaterialController.uploadAttachment
);

// Update material aliases
router.put(
    "/:materialId/aliases",
    AuthToken.authSession,
    MaterialController.updateAliases
);

// Serve attachment file
router.get("/file/:filename", MaterialController.serveFile);

module.exports = router;
