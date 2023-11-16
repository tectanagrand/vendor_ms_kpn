const Reqstat = require("../models/ReqstatModel");

const ReqstatController = {
    request: async (req, res) => {
        try {
            const reqForm = req.body;
            const reqstat = await Reqstat.request(reqForm);
            res.status(200).send({
                message: `Ticket ${reqstat.ticket_num} has been requested`,
            });
        } catch (error) {
            res.status(500).send({
                message: error.stack,
            });
        }
    },
    processReq: async (req, res) => {
        try {
            const ticketid = req.body.ticketid;
            const session = req.body.session;
            const action = req.body.action;
            const processReq = await Reqstat.processReq(
                ticketid,
                session,
                action
            );
            res.status(200).send({
                message: `${processReq.name} status change request has been processed`,
            });
        } catch (error) {
            res.status(500).send({
                message: error.stack,
            });
        }
    },
    showAll: async (req, res) => {
        try {
            const data = await Reqstat.showAll();
            res.status(200).send(data);
        } catch (error) {
            res.status(500).send({
                message: error.stack,
            });
        }
    },
};

module.exports = ReqstatController;
