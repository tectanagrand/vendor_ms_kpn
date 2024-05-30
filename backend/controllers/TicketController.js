const TRANS = require("../config/transaction");
const Ticket = require("../models/TicketModel");
const Vendor = require("../models/VendorModel");
const Emailer = require("../models/EmailModel");
const db = require("../config/connection");
const crud = require("../helper/crudquery");
const moment = require("moment");
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
    const cookies = req.cookies;
    try {
        const [ticket_id, reject_by, ven_name] = await Ticket.rejectTicket(
            params.ticket_id,
            params.remarks,
            cookies.user_id
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
        if (updateTicket.action === "accept") {
            res.render("response", {
                ven_name: updateTicket.name,
                ven_type: updateTicket.type,
                company: updateTicket.company,
                reason: "has approved by you",
                rejected: "approved",
            });
        } else if (updateTicket.action === "rejected") {
            res.render("response", {
                ven_name: updateTicket.name,
                ven_type: updateTicket.type,
                company: updateTicket.company,
                reason: "has rejected by you",
                rejected: "rejected",
            });
        } else {
            res.render("rejectform", {
                cur_pos: "CEO",
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

TicketController.processMgrPrc = async (req, res) => {
    const ticket_id = req.query.ticket_id;
    const action = req.query.action;
    try {
        const updateTicket = await Ticket.processMgrPrc(ticket_id, action);
        if (updateTicket.action === "accept") {
            res.render("response", {
                ven_name: updateTicket.name,
                ven_type: updateTicket.type,
                company: updateTicket.company,
                reason: "has approved by you",
                rejected: "approved",
            });
        } else if (updateTicket.action === "rejected") {
            res.render("response", {
                ven_name: updateTicket.name,
                ven_type: updateTicket.type,
                company: updateTicket.company,
                reason: "has rejected by you",
                rejected: "rejected",
            });
        } else {
            res.render("rejectform", {
                cur_pos: "MGRPRC",
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
    const date = moment().format("YYYY-MM-DD");
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
            cur_pos: "PROC",
            ticket_state: "CREA",
            reject_by: "CEO",
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
        const [qins, valins] = crud.insertItem(
            "log_rejection",
            {
                ticket_id: ticket_id,
                create_at: date,
                remarks: reason,
                create_by: "CEO",
                ticket_state: "FINA",
            },
            "ticket_id"
        );
        await client.query(qins, valins);
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
            rejected: "rejected",
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

TicketController.rejectformgrproc = async (req, res) => {
    const { ticket_id, reason } = req.body;
    const today = moment().format("YYYY-MM-DD");
    try {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const { rows: ticketItem } = await client.query(`
                select t.ticket_id, t.is_active, t.cur_pos,
                v.name_1, v.ven_type, v.ven_id, c.name, c.code,
                usr.email as email_user, mgr.email as email_mgr
                from ticket t
                left join vendor v on v.ven_id = t.ven_id
                left join mst_company c on c.comp_id = v.company
                left join mst_user usr on t.proc_id = usr.user_id
                left join mst_mgr mgr on usr.mgr_id = mgr.mgr_id
                where t.token = '${ticket_id}'`);
            const { rows: emailmgrprc } = await client.query(`select
                email from mst_mgr mm
            left join (
                select
                    distinct user_group_id,
                    user_group_name
                from
                    mst_page_access mpa) mpa on
                mm.user_group = mpa.user_group_id 
            where mpa.user_group_name = 'MGRPRC';`);
            const emailTargets = ticketItem[0].email_user;
            const ticketUp = {
                reject_by: "MGRPROC",
                cur_pos: "PROC",
                updated_at: today,
                remarks: reason,
            };
            const where = {
                token: ticket_id,
            };
            const [que, val] = crud.updateItem(
                "ticket",
                ticketUp,
                where,
                "ticket_id"
            );
            const [qins, valins] = crud.insertItem(
                "log_rejection",
                {
                    ticket_id: ticket_id,
                    create_at: today,
                    remarks: reason,
                    create_by: "MGRPRC",
                    ticket_state: "CREA",
                },
                "ticket_id"
            );
            await client.query(que, val);
            await client.query(qins, valins);
            await client.query(TRANS.COMMIT);
            await Emailer.RejectMgrPrc(
                ticketItem[0].name_1,
                ticketItem[0].ven_type,
                `${ticketItem[0].code} - ${ticketItem[0].name}`,
                reason,
                [emailTargets],
                emailmgrprc[0].email
            );
            await client.query(TRANS.COMMIT);
            res.render("response", {
                ven_name: ticketItem.name_1,
                ven_type: ticketItem.ven_type,
                company: `${ticketItem.code} - ${ticketItem.name}`,
                reason: "has rejected by you",
                rejected: "rejected",
            });
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
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
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TicketController.rejectLog = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const { ticket_state, ticket_id } = req.query;
            const q = `select lr.remarks, lr.create_at, coalesce(mu.fullname, lr.create_by) as create_by, lr.id from log_rejection lr
            left join mst_user mu on mu.user_id = lr.create_by 
            where ticket_id = $1 and ticket_state = $2 order by create_at desc`;
            const { rows } = await client.query(q, [ticket_id, ticket_state]);
            const results = rows.map(item => ({
                id: item.id,
                remarks: item.remarks,
                create_at: moment(item.create_at).format("DD-MM-YYYY HH:mm:ss"),
                create_by: item.create_by,
            }));
            res.status(200).send(results);
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};
module.exports = TicketController;
