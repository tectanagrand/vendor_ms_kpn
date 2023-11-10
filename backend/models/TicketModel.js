const db = require("../config/connection");
const uuid = require("uuidv4");
const TRANS = require("../config/transaction");
const crud = require("../helper/crudquery");
const jwt = require("jsonwebtoken");
const Vendor = require("../models/VendorModel");
const Emailer = require("../models/EmailModel");

const Ticket = {
    async showAll() {
        try {
            const client = db;
            const items = await client.query(
                `SELECT T.*,
                    V.NAME_1,
                    V.VEN_CODE,
                    UR.EMAIL,
                    CASE WHEN T.REJECT_BY IS NOT NULL THEN 'REJECT'
                    WHEN T.CUR_POS = 'END' THEN 'ACCEPTED'
                    ELSE 'ON PROCESS' END
                    AS STATUS_TICKET
                FROM TICKET T
                LEFT JOIN VENDOR V ON V.VEN_ID = T.VEN_ID
                LEFT JOIN MST_USER UR ON UR.USER_ID = T.PROC_ID
                ORDER BY T.TICKET_ID DESC`
            );
            return {
                count: items.rowCount,
                data: items.rows,
            };
        } catch (err) {
            console.error(err);
            throw err;
        }
    },
    async headerTicket({ tnum: ticket_num }) {
        try {
            let formhd = await db.query(
                `SELECT T.ticket_id as ticket_id, T.cur_pos, T.remarks, t.valid_until, t.ven_id as ticket_ven_id, V.*, 
                PROC.email as email_proc, PROC.department as dep_proc, MDM.email as email_mdm, MDM.department as dep_mdm, VHD.header 
                                FROM TICKET T
                                LEFT JOIN VENDOR V ON V.VEN_ID = T.VEN_ID
                                LEFT JOIN MST_USER PROC ON PROC.USER_ID = T.PROC_ID
                                LEFT JOIN MST_USER MDM ON MDM.USER_ID = T.MDM_ID
                                LEFT JOIN VEN_CODE_HD VHD ON (V.local_ovs = VHD.local_ovs AND v.ven_group = vhd.ven_group AND v.ven_acc = vhd.ven_acc AND v.ven_type = vhd.ven_type )
                                WHERE T.TOKEN = '${ticket_num}'
                                ORDER BY T.CREATED_AT DESC`
            );
            if (formhd.rows[0] == null || formhd.rows[0] == undefined) {
                throw {
                    message: "Ticket is not found",
                };
            }
            const ticketDate = new Date(formhd.rows[0].valid_until).getTime();
            const today = new Date().getTime();
            if (formhd.rows[0].is_active === false) {
                throw {
                    message: `Ticket ${formhd.rows[0].ticket_id} is inactive`,
                };
            }
            if (today > ticketDate) {
                throw {
                    message: `Ticket ${formhd.rows[0].ticket_id} is expired`,
                };
            }
            return formhd.rows[0];
        } catch (err) {
            console.error(err);
            throw err;
        }
    },
    async openNew(params) {
        const today = new Date();
        const until = new Date();
        const year = today.getFullYear().toString().substr(-2);
        const month = ("0" + (today.getMonth() + 1).toString()).substr(-2);
        const f_today = today.toLocaleDateString();
        until.setDate(today.getDate() + 3);
        const f_until = until.toLocaleDateString();
        const ticketid = await db.query("SELECT nextval('ticket_id_seq')");
        const ven_id = uuid.uuid();
        const token = uuid.uuid();
        // console.log(ticketid.rows);
        const latestnum = ticketid.rows[0].nextval;
        const ticketNumber =
            "VMS-" + year + month + String(latestnum).padStart(4, "0");

        try {
            // insert into ticket
            const client = db;
            await client.query("BEGIN");
            const ticket = {
                ticket_id: ticketNumber,
                ven_id: ven_id,
                proc_id: params.user_id,
                valid_until: f_until,
                cur_pos: params.to_who,
                is_active: true,
                token: token,
            };
            const [q, val] = crud.insertItem("TICKET", ticket, "*");
            const result = await client.query(q, val);
            await client.query("COMMIT");
            return result.rows[0];
        } catch (err) {
            console.error(err);
            await client.query("ROLLBACK");
            throw err;
        }
    },

    async getTicketById(ticket_num) {
        try {
            const client = db;
            const q = `SELECT T.ticket_id as ticket_id, T.cur_pos, T.remarks, T.ven_id as ticket_ven_id, V.*, 
            PROC.email as email_proc, PROC.department as dep_proc, MDM.email as email_mdm, MDM.department as dep_mdm, VHD.header 
                            FROM TICKET T
                            LEFT JOIN VENDOR V ON V.VEN_ID = T.VEN_ID
                            LEFT JOIN MST_USER PROC ON PROC.USER_ID = T.PROC_ID
                            LEFT JOIN MST_USER MDM ON MDM.USER_ID = T.MDM_ID
                            LEFT JOIN VEN_CODE_HD VHD ON (V.local_ovs = VHD.local_ovs AND v.ven_group = vhd.ven_group AND v.ven_acc = vhd.ven_acc AND v.ven_type = vhd.ven_type )
                            WHERE T.TOKEN = '${ticket_num}'
                            ORDER BY T.CREATED_AT DESC`;
            const item = await client.query(q);
            return item.rows[0];
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    },

    async submitTicket(item, client) {
        try {
            const ticketq =
                await client.query(`SELECT tic.ticket_id, tic.cur_pos, proc.department as proc, mdm.department as mdm, v.is_tender, v.name_1  from ticket tic
                        left join (select user_id, department from mst_user) proc on proc.user_id = tic.proc_id
                        left join (select user_id, department from mst_user) mdm on mdm.user_id = tic.mdm_id
                        left join vendor v on tic.ven_id = v.ven_id 
                        where tic.token = '${item.ticket_id}'`);
            const ticket = ticketq.rows[0];
            const session = ticket.cur_pos;
            const proc = ticket.proc;
            const mdm = ticket.mdm;
            const name_1 = ticket.name_1;
            let cur_pos;
            switch (session) {
                case "VENDOR":
                    cur_pos = "PROC";
                    break;
                case "PROC":
                    if (ticket.is_tender) {
                        cur_pos = "MGR";
                    } else {
                        cur_pos = "MDM";
                    }
                    break;
                case "MDM":
                    cur_pos = "END";
            }
            const q = `UPDATE ticket
                                set cur_pos = $1,
                                remarks = $2,
                                reject_by = null,
                                updated_at = DEFAULT
                                where ticket_id = $3
                                returning ticket_id`;
            return client.query(q, [cur_pos, item.remarks, ticket.ticket_id]);
        } catch (err) {
            console.error(err);
            throw err;
        }
    },

    async rejectTicket(ticket_id, remarks, role) {
        const client = db;
        try {
            await client.query(TRANS.BEGIN);
            const ticketq =
                await client.query(`SELECT tic.token as ticket_id, tic.ticket_id as ticket_num, tic.cur_pos, proc.department as proc, mdm.department as mdm, v.is_tender, v.name_1  from ticket tic
                        left join (select user_id, department from mst_user) proc on proc.user_id = tic.proc_id
                        left join (select user_id, department from mst_user) mdm on mdm.user_id = tic.mdm_id
                        left join vendor v on tic.ven_id = v.ven_id 
                        where tic.token = '${ticket_id}'`);
            const targets = await this.ticketTarget(ticket_id);
            const dataTrg = targets.data;
            const ticket = ticketq.rows[0];
            const session = ticket.cur_pos;
            let reject_by;
            let cur_pos;
            switch (session) {
                case "VENDOR":
                    reject_by = "PROC";
                    cur_pos = "VENDOR";
                    break;
                case "PROC":
                    reject_by = "PROC";
                    cur_pos = "VENDOR";
                    break;
                case "MGR":
                    reject_by = "MGR";
                    cur_pos = "PROC";
                    break;
                case "MDM":
                    reject_by = "MDM";
                    cur_pos = "PROC";
                    break;
            }
            const q = `UPDATE ticket
                                set reject_by = '${reject_by}',
                                remarks =  '${remarks}',
                                cur_pos = '${cur_pos}',
                                updated_at = DEFAULT
                                where token = '${ticket.ticket_id}'
                                returning ticket_id`;
            const upTick = await client.query(q);
            await Emailer.toReject(remarks, ticket.name_1, dataTrg.proc_email, [
                dataTrg.mgr_pr_email,
                dataTrg.mgr_md_email,
            ]);
            await client.query(TRANS.COMMIT);
            return [upTick.rows[0].ticket_id, reject_by, ticket.name_1];
        } catch (err) {
            console.error(err.stack);
            await client.query(TRANS.ROLLBACK);
            return err;
        }
    },

    async ticketTarget(ticket_id) {
        try {
            const getTargetsq = `
            select 
            proc.email as proc_email, 
            mdm.email as mdm_email, 
            mgr_pr.email as mgr_pr_email,
            mgr_md.email as mgr_md_email,
            proc.fullname as proc_fname,
            mdm.fullname as mdm_fname
            from ticket t
                left join mst_user proc on proc.user_id = t.proc_id
                left join mst_user mdm on mdm.user_id = t.mdm_id
                left join mst_mgr mgr_pr on mgr_pr.mgr_id = proc.mgr_id
                left join mst_mgr mgr_md on mgr_md.mgr_id = mdm.mgr_id
                where t.token = '${ticket_id}'
            `;
            const item = await db.query(getTargetsq);
            return {
                count: item.rowCount,
                data: item.rows[0],
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    async submitVendor({
        ven_detail,
        ven_banks,
        ven_files,
        ticket_id,
        remarks,
        is_draft,
        role,
    }) {
        //set vendor detail
        const client = db;
        try {
            await client.query(TRANS.BEGIN);
            const client1 = await Vendor.setDetailVen(ven_detail, client);
            const client2 = await Vendor.setBank(ven_banks, client1);
            const client3 = await Vendor.setFile(ven_files, client2);
            console.log(client3);
            const ticket = await this.submitTicket(
                { ticket_id: ticket_id, remarks: remarks },
                client3
            );
            const targets = await this.ticketTarget(ticket_id);
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
            return res_tnum;
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            console.error(error);
            throw error;
        }
    },
};

module.exports = Ticket;
