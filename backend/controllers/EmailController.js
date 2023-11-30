const Emailer = require("../models/EmailModel");

const EmailController = {
    sendToManager: async (req, res) => {
        try {
            const ven_name = req.body.name;
            const ven_type = req.body.ven_type;
            const comp = req.body.comp;
            const send = await Emailer.toManager(
                ven_name,
                ven_type,
                comp,
                ticket_id
            );
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
