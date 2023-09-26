const Master = require("../models/MasterModel");

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
};

module.exports = MasterController;
