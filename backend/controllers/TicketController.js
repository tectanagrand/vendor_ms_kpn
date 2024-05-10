const TRANS = require("../config/transaction");
const Ticket = require("../models/TicketModel");
const Vendor = require("../models/VendorModel");
const Emailer = require("../models/EmailModel");
const db = require("../config/connection");
const crud = require("../helper/crudquery");
const fa = require("speakeasy");
const path = require("path");

const TicketController = {};

TicketController.openNew = async (req, res) => {
    try {
        let result = await Ticket.openNew(req.body);
        res.status(200).send({
            status: 200,
            message: `Ticket ${result.ticket_id} successfully created`,
            data: result,
        });
    } catch (err) {
        res.status(500).send({
            status: 400,
            message: err.stack,
        });
    }
};

TicketController.headerTicket = async (req, res) => {
    // console.log(req.params);
    try {
        let result = await Ticket.headerTicket(req.params);
        res.status(200).send({
            status: 200,
            data: result,
        });
    } catch (err) {
        res.status(500).send({
            status: 500,
            message: err.message,
        });
    }
};

TicketController.showAll = async (req, res) => {
    try {
        const state = req.query;
        const row = await Ticket.showAll(state);
        res.status(200).send({
            status: 200,
            data: row,
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            status: 500,
            message: "Failed to fetch data",
        });
    }
};

TicketController.getTicketById = async (req, res) => {
    try {
        const result = await Ticket.getTicketById(req.params.id);
        res.status(200).send({
            status: 200,
            data: result,
        });
    } catch (err) {
        res.status(500).send({
            status: 500,
            message: "Failed to fetch data",
        });
    }
};

TicketController.submitTicket = async (req, res) => {
    const client = await db.connect();
    try {
        //expected input :
        /*
            {
                is_draft : <boolean>,
                ticket_id : ,
                ven_detail : {
                    ticket_id :
                    ven_id :,
                    ... data ven_detail
                }
                ven_banks : [
                    {
                        method : <insert, update, delete>
                        ven_id :,
                        bankv_id :,
                        ... data bank
                    },
                    ...
                ],
                ven_files : [
                    {
                        method : <insert, delete>,
                        ven_id :,
                        file_id :,
                        ... data file
                    }
                ]
            }
        */
        const {
            ticket_id,
            remarks,
            ven_detail,
            ven_banks,
            ven_files,
            is_draft,
            role,
        } = req.body;
        // return;
        //change ticket cur_pos
        await client.query(TRANS.BEGIN);
        let promises = [];
        // if (!is_draft) {
        //     promises.push(
        //         Ticket.submitTicket(
        //             { ticket_id: ticket_id, remarks: remarks },
        //             client
        //         )
        //     );
        // }
        if (ven_detail != null) {
            promises.push(Vendor.setDetailVen(ven_detail, client));
        }
        if (ven_banks.length != 0) {
            promises.push(Vendor.setBank(ven_banks, client));
        }
        if (ven_files.length != 0) {
            promises.push(Vendor.setFile(ven_files, client));
        }
        Promise.all(promises)
            .then(async result => {
                try {
                    const ticket = await Ticket.submitTicket(
                        { ticket_id: ticket_id, remarks: remarks },
                        client
                    );
                    const targets = await Ticket.ticketTarget(ticket_id);
                    const dataTrg = targets.data;
                    const res_tnum = ticket.rows[0].ticket_id;
                    if (!is_draft && role === "PROC") {
                        await Emailer.toRequest(
                            ven_detail.ticket_num,
                            dataTrg.proc_fname,
                            dataTrg.proc_email,
                            [dataTrg.mgr_pr_email]
                        );
                    } else if (!is_draft && role === "MDM") {
                        await Emailer.toApprove(
                            ven_detail.ven_code,
                            ven_detail.name_1,
                            dataTrg.proc_email,
                            [
                                dataTrg.mgr_pr_email,
                                dataTrg.mgr_md_email,
                                dataTrg.mdm_email,
                            ]
                        );
                    }
                    await client.query(TRANS.COMMIT);
                    res.status(200).send({
                        status: 200,
                        message: !is_draft
                            ? `${ven_detail.name_1} Vendor with num ticket : ${res_tnum} has been requested`
                            : `${ven_detail.ticket_num} Ticket draft has been saved`,
                        data: req.body,
                    });
                } catch (err) {
                    console.log(err);
                }
            })
            .catch(async err => {
                res.status(500).send({
                    status: 500,
                    message: err.message,
                });
                await client.query(TRANS.ROLLBACK);
                console.error(err.stack);
            });
    } catch (err) {
        await client.query(TRANS.ROLLBACK);
        res.status(500).send({
            message: err.message,
        });
    } finally {
        client.release();
    }
};

TicketController.submitVendor = async (req, res) => {
    try {
        const { ven_detail, is_draft } = req.body;
        const submission = await Ticket.submitVendor(req.body);
        res.status(200).send({
            message: !is_draft
                ? `${ven_detail.name_1} Vendor with num ticket : ${submission} has been requested`
                : `${ven_detail.ticket_num} Ticket draft has been saved`,
            data: req.body,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            message: "Failed create ticket",
        });
    }
};

TicketController.singleSubmit = async (req, res) => {
    const client = await db.connect();
    try {
        await client.query(TRANS.BEGIN);
        const [ticket_num, name_1] = await Ticket.submitTicket(
            req.body.ticket_id,
            client
        );
        res.status(200).send({
            status: 200,
            message: `Ticket ${ticket_num} is submitted`,
        });
        await client.query(TRANS.COMMIT);
    } catch (err) {
        await client.query(TRANS.ROLLBACK);
        res.status(500).send({
            status: 500,
            message: `Error submission`,
        });
    } finally {
        client.release();
    }
};

TicketController.rejectTicket = async (req, res) => {
    const params = req.body;
    try {
        const [ticket_id, reject_by, ven_name] = await Ticket.rejectTicket(
            params.ticket_id,
            params.remarks
        );
        const targets = await Ticket.ticketTarget(params.ticket_id);
        const dt_target = targets.data;
        if (params.role === "MDM") {
            await Emailer.toReject(
                params.remarks,
                ticket_id,
                ven_name,
                dt_target.proc_email,
                [
                    dt_target.mdm_email,
                    dt_target.mgr_md_email,
                    dt_target.mgr_pr_email,
                ]
            );
        }
        res.status(200).send({
            status: 200,
            message: `Ticket Number : ${ticket_id} is rejected by ${reject_by}`,
        });
    } catch (err) {
        res.status(500).send({
            status: 500,
            message: err.message,
        });
    }
};

TicketController.processMgr = async (req, res) => {
    const ticket_id = req.query.ticket_id;
    const action = req.query.action;
    try {
        const updateTicket = await Ticket.processMgr(ticket_id, action);
        // res.status(200).send({
        //     message: `${updateTicket.name} with ticket number ${
        //         updateTicket.ticket_num
        //     } is ${action === "accept" ? "approved" : "rejected"} `,
        // });
        if (action === "accept") {
            res.render("response", {
                ven_name: updateTicket.name,
                ven_type: updateTicket.type,
                company: updateTicket.company,
                reason: "has approved by you",
            });
        } else {
            res.render("rejectform", {
                ven_name: updateTicket.name,
                ven_type: updateTicket.type,
                company: updateTicket.company,
                ticket_id: req.query.ticket_id,
                reason: "has rejected by you",
                ticket_id: ticket_id,
            });
        }
    } catch (error) {
        res.render("notvalid");
    }
};

TicketController.deleteTicket = async (req, res) => {
    const ticket_id = req.params.ticket_id;
    const client = await db.connect();
    await client.query(TRANS.BEGIN);
    const check = await client.query(
        `select ticket_id, ven_id from ticket where token = '${ticket_id}'`
    );
    const ven_id = check.rows[0].ven_id;
    if (check.rowCount == 0) {
        res.status(203).send({
            message: "ticket not exist",
        });
    }
    try {
        const deleteTicket = await client.query(
            `delete from ticket where token = '${ticket_id}' returning ticket_id`
        );
        const deletedTicket = deleteTicket.rows[0].ticket_id;
        const checkVen = await client.query(
            `select ven_id from vendor where ven_id = '${ven_id}'`
        );
        if (checkVen.rowCount > 0) {
            const deleteVendor = await client.query(
                `delete from vendor where ven_id = '${ven_id}' returning ven_id`
            );
        }
        await client.query(TRANS.COMMIT);
        res.status(200).send({
            data: deletedTicket,
        });
    } catch (error) {
        await client.query(TRANS.ROLLBACK);
        console.log(error.message);
        res.status(500).send({
            message: error.message,
        });
    } finally {
        client.release();
    }
};

TicketController.testmgr = (req, res) => {
    res.render("rejectform", {
        ven_name: "jess",
        ven_type: "jess",
        company: "jess",
        ven_id: "122331",
        reason: "undefined",
    });
};

TicketController.rejectformmgr = async (req, res) => {
    const { ticket_id, reason } = req.body;
    const date = new Date().toLocaleDateString();
    const client = await db.connect();
    try {
        await client.query(TRANS.BEGIN);
        const checkTicket = await client.query(`
                select t.ticket_id, t.is_active, t.cur_pos,
                v.name_1, v.ven_type, v.ven_id, c.name, c.code,
                usr.email as email_user, mgr.email as email_mgr
                from ticket t
                left join vendor v on v.ven_id = t.ven_id
                left join mst_company c on c.comp_id = v.company
                left join mst_user usr on t.proc_id = usr.user_id 
                left join mst_mgr mgr on usr.mgr_id = mgr.mgr_id
                where t.token = '${ticket_id}'
        `);
        const ticketItem = checkTicket.rows[0];
        const emailTargets = [ticketItem.email_user, ticketItem.email_mgr];
        const itemup = {
            is_active: false,
            reject_by: "MGR",
            updated_at: date,
            remarks: reason,
        };
        const where = {
            token: ticket_id,
        };
        const [query, val] = crud.updateItem(
            "ticket",
            itemup,
            where,
            "ticket_id"
        );
        const rejectTicket = await client.query(query, val);
        await client.query(TRANS.COMMIT);
        await Emailer.RejectMgrToProc(
            ticketItem.name_1,
            ticketItem.ven_type,
            `${ticketItem.code} - ${ticketItem.name}`,
            reason,
            emailTargets
        );
        res.render("response", {
            ven_name: ticketItem.name_1,
            ven_type: ticketItem.ven_type,
            company: `${ticketItem.code} - ${ticketItem.name}`,
            reason: "has rejected by you",
        });
        // res.status(200).send({
        //     message: "Ticket has been rejected",
        // });
    } catch (error) {
        console.log(error);
        await client.query(TRANS.ROLLBACK);
        res.status(500).send({
            message: "error updating",
        });
    } finally {
        client.release();
    }
};

TicketController.checkValidTicket = async (req, res) => {
    const { ticket_id } = req.body;
    const client = await db.connect();
    try {
        const getTime = await client.query(
            `select valid_until, ticket_id from ticket where token = '${ticket_id}'`
        );
        const timeValid = new Date(getTime.rows[0].valid_until);
        const today = new Date();
        if (timeValid < today) {
            res.status(403).send({
                message: `${getTime.rows[0].ticket_id} is closed`,
            });
        } else {
            res.status(200).send({
                message: "ticket is valid",
            });
        }
    } catch (error) {
        res.status(500).send({
            message: "something went wrong",
            error: error.message,
        });
    } finally {
        client.release();
    }
};

TicketController.extendOneDay = async (req, res) => {
    try {
        const ticket_id = req.body.ticket_id;
        const updateExpiry = await Ticket.extendTicket(ticket_id, 1);
        res.status(200).send({
            ticket_num: updateExpiry.ticket_num,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TicketController.resendCEO = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const ticket_id = req.body.ticket_id;
            const { rows } = await client.query(
                `SELECT T.TOKEN,
            V.NAME_1,
            V.DESCRIPTION,
            V.VEN_TYPE,
            V.COMPANY
        FROM TICKET T
        LEFT JOIN VENDOR V ON T.VEN_ID = V.VEN_ID
        WHERE T.TOKEN = $1`,
                [ticket_id]
            );
            let { name_1, description, ven_type, company } = rows[0];
            await Emailer.toManager(
                name_1,
                ven_type,
                company,
                ticket_id,
                description
            );
            res.status(200).send({
                message: "Ticket Resent",
            });
        } catch (error) {
            throw error;
        } finally {
            client.release;
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};
module.exports = TicketController;
