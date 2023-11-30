const Master = require("../models/MasterModel");
const path = require("path");
const db = require("../config/connection");

const MasterController = {
    getCountry: async (req, res) => {
        try {
            const result = await Master.getCountry();
            res.status(200).send({
                status: 200,
                data: result,
            });
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: "failed to fetch data",
            });
        }
    },

    getCurrency: async (req, res) => {
        try {
            const result = await Master.getCurrency();
            res.status(200).send({
                status: 200,
                data: result,
            });
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: "failed to fetch data",
            });
        }
    },

    getBank: async (req, res) => {
        try {
            const result = await Master.getBank();
            res.status(200).send({
                status: 200,
                data: result,
            });
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: "failed to fetch data",
            });
        }
    },

    getCity: async (req, res) => {
        try {
            const countryId = req.body.countryId ? req.body.countryId : null;
            const result = await Master.getCities(countryId);
            res.status(200).send({
                status: 200,
                data: result,
            });
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: "failed to fetch data",
            });
        }
    },

    getCompany: async (req, res) => {
        try {
            const result = await Master.getCompany();
            res.status(200).send({
                status: 200,
                data: result,
            });
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: "failed to fetch data",
            });
        }
    },

    downloadFile: async (req, res) => {
        try {
            const filename = req.params.filename;
            res.download(`${path.resolve()}\\backend\\public\\${filename}`);
        } catch (err) {
            res.status(500).send({
                message: "Error retrieve file",
            });
        }
    },

    genQrcode: async (req, res) => {
        try {
            const qrcode = await Master.genQrAuth();
            res.status(200).send(qrcode);
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    },

    getPayterm: async (req, res) => {
        try {
            const payTerm = await db.query(`SELECT * FROM MST_PAY_TERM`);
            res.status(200).send({
                count: payTerm.rowCount,
                data: payTerm.rows,
            });
        } catch (error) {
            console.error(error.message);
            res.status(500).send({
                message: error.message,
            });
        }
    },
};

module.exports = MasterController;
