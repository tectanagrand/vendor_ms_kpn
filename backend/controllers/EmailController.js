const Emailer = require("../models/EmailModel");

const EmailController = {
    sendToManager: async (req, res) => {
        try {
            const send = await Emailer.toManager();
            res.status(200).send(send);
        } catch (err) {
            res.status(500).send(err);
        }
    },
    sendToRequest: async (req, res) => {
        try {
            const send = await Emailer.toRequest();
            res.status(200).send(send);
        } catch (err) {
            res.status(500).send(err);
        }
    },
    sendToApprove: async (req, res) => {
        try {
            const send = await Emailer.toApprove();
            res.status(200).send(send);
        } catch (err) {
            res.status(500).send(err);
        }
    },
    sendToReject: async (req, res) => {
        try {
            const send = await Emailer.toReject();
            res.status(200).send(send);
        } catch (err) {
            res.status(500).send(err);
        }
    },
};

module.exports = EmailController;
