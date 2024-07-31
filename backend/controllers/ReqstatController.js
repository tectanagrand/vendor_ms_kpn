const Reqstat = require("../models/ReqstatModel");
const db = require("../config/connection");

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
            const data = await Reqstat.showAll(req.query);
            res.status(200).send(data);
        } catch (error) {
            res.status(500).send({
                message: error.stack,
            });
        }
    },
    approvalMgr: async (req, res) => {
        try {
            const client = await db.connect();
            try {
                const { ticket_id, action } = req.query;
                const { rows: getTicket } = await client.query(
                    `select cur_pos, reject_remark from ticket_reqstat_ven where ticket_id = $1`,
                    [ticket_id]
                );
                const { rows: dataTicket } = await client.query(
                    `
                    select 
                    request,
                    concat(c.name, ' (', c.sap_code, ')') as company ,
                    v.name_1
                    from ticket_reqstat_ven trv
                    left join vendor v on v.ven_id = trv.ven_id
                    left join mst_company c on c.comp_id = v.company
                    where trv.ticket_id = $1`,
                    [ticket_id]
                );
                const { request, company, name_1 } = dataTicket[0];
                const actionReq =
                    request === 1 ? "reactivation" : "deactivation";
                if (getTicket[0]?.cur_pos === "MDM") {
                    throw new Error("TIcket invalid");
                }
                if (
                    getTicket[0].cur_pos === "MGRPRC" &&
                    getTicket[0].reject_remark
                ) {
                    res.render("responsedeact", {
                        actionReq: actionReq,
                        rejected: "rejected",
                        action: "rejected",
                        ven_name: name_1,
                        company: company,
                    });
                }
                if (action === "accept") {
                    const { actionReq, rejected, ven_name, company } =
                        await Reqstat.approvalMgr(ticket_id, action);
                    const messageRes =
                        action === "accept" ? "approved" : "rejected";
                    res.render("responsedeact", {
                        actionReq: actionReq,
                        rejected: rejected,
                        action: messageRes,
                        ven_name: ven_name,
                        company: company,
                    });
                } else {
                    res.render("rejectformdeact", {
                        action: actionReq,
                        ven_name: name_1,
                        company: company,
                        ticket_id: ticket_id,
                    });
                }
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error(error);
            res.render("notvalid");
        }
    },
    rejectMgr: async (req, res) => {
        try {
            const { ticket_id, reason } = req.body;
            const rejectedMgr = await Reqstat.rejectMgr(ticket_id, reason);
            res.status(200).send({
                message: "Successfully rejected",
            });
        } catch (error) {
            res.status(500).send({
                message: error.message,
            });
        }
    },
};

module.exports = ReqstatController;
