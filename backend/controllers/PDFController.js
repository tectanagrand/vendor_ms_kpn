const PDF = require("../models/PDFModel");

const PDFController = {
    ExportPDF: async (req, res) => {
        try {
            const ven_id = req.body.ven_id;
            const exportedPDF = PDF.exportPDF(ven_id);
            res.status(200).send({
                exportedPDF,
            });
        } catch (error) {
            res.status(500).send({
                message: error.message,
            });
        }
    },
};
