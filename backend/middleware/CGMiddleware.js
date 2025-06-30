const CGApi = require("../models/CGApiModel");

let CGMiddleware = {};

CGMiddleware.ErrorHandler = async (err, req, res, next) => {
    console.error(err);
    const error = err.response.data;
    if (!error) res.status(500).send({ message: err.message });
    if (error.code == 422) {
        res.status(400).send({
            message: error.message,
        });
    }
    if (error.code == 401) {
        res.status(401).send({
            message: error.message,
        });
    }
};

CGMiddleware.CheckSessionExist = async (req, res, next) => {
    try {
        const checkExist = await CGApi.CheckSessionCGExist();
        if (!checkExist) {
            res.status(401).send({
                message: "CG Session not authorized",
            });
            return;
        }
        req.cg_session = checkExist;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
    }
};

module.exports = CGMiddleware;
