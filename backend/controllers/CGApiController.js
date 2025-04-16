const CGApi = require("../models/CGApiModel");

const CGApiController = {};

CGApiController.Example = async (req, res) => {
    try {
        res.status(200).send(req.cg_session);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
    }
};

CGApiController.GetVendorCG = async (req, res, next) => {
    try {
        const { q } = req.query;
        const data = await CGApi.GetVendorData(
            q,
            req.cg_session.token,
            req.cookies.user_id
        );
        res.status(200).send({
            data: data,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = CGApiController;
