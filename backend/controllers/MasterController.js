const Master = require("../models/MasterModel");
const path = require("path");
const db = require("../config/connection");
const TRANS = require("../config/transaction");
const os = require("os");

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
        const filename = req.params.filename;
        let pathDwn = "";
        if (os.platform() === "linux") {
            pathDwn = `${path.resolve()}/backend/public/${filename}`;
        } else {
            pathDwn = `${path.resolve()}\\backend\\public\\${filename}`;
        }
        res.download(pathDwn, err => {
            if (err) {
                // Handle errors here
                console.error("Error during download:", err);
                res.status(500).send({
                    message: "error during download",
                });
            } else {
                // Download was successful
                console.log("File downloaded successfully");
            }
        });
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
    getBankSAP: async (req, res) => {
        try {
            const country = req.query.country === "" ? "ID" : req.query.country;
            const payTerm = await db.query(
                `SELECT * FROM MST_BANK_SAP WHERE country='${country}'`
            );
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
    getBankSSR: async (req, res) => {
        try {
            const data = await Master.getssrBank({
                page: req.body.page,
                maxPage: req.body.maxPage,
                que: req.body.que,
            });
            res.status(200).send(data);
        } catch (error) {
            res.status(500).send({ message: error.message });
        }
    },
    insertBank: async (req, res) => {
        try {
            const insertitem = await Master.createNewBank(req.body);
            res.status(200).send(insertitem);
        } catch (error) {
            res.status(500).send({ message: error.message });
        }
    },
    deleteBank: async (req, res) => {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const deleteBank = await client.query(
                `delete from mst_bank_sap where bank_code = '${req.body.bankcode}' and bank_key = '${req.body.bankkey}' returning bank_name`
            );
            res.status(200).send({ name: deleteBank.rows[0].bank_name });
            await client.query(TRANS.COMMIT);
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            res.status(500).send({ message: error.message });
            console.log(error);
        }
    },
};

module.exports = MasterController;
