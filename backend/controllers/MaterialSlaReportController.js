const materialSlaReportService = require("../services/materialSlaReportService");

module.exports = {
    getReport: async (req, res) => {
        try {
            const data = await materialSlaReportService.getMaterialSlaReport({
                actorUsername: req.cookies?.username,
                query: req.query,
            });
            return res.status(200).json({ success: true, data });
        } catch (error) {
            if (!error.statusCode) {
                console.error("[MATERIAL-SLA-REPORT]", error.message);
            }
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.statusCode
                    ? error.message
                    : "Failed to load the material SLA report.",
            });
        }
    },
};
