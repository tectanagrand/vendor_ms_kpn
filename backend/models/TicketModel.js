const db = require("../config/connection");
const uuid = require("uuidv4");
const TRANS = require("../config/transaction");
const crud = require("../helper/crudquery");
const jwt = require("jsonwebtoken");
const Vendor = require("../models/VendorModel");
const Emailer = require("../models/EmailModel");

const Ticket = {
    async showAll({ is_active, ticket_state }) {
        const client = await db.connect();
        try {
            let where = "";
            if (is_active === "true") {
                where = `WHERE T.is_active = ${is_active} AND ticket_state in (${ticket_state}) `;
            } else {
                where = `WHERE T.is_active = ${is_active} `;
            }
            let q = `SELECT T.token,
            T.is_active, 
            T.ticket_id, 
            T.created_at,
            case when T.cur_pos = 'MGR' then 'CEO'
            else T.cur_pos
            end as cur_pos,
            T.ticket_state,
            V.NAME_1,
            V.VEN_CODE,
            UR.EMAIL,
            T.VALID_UNTIL,
            CASE WHEN T.REJECT_BY IS NOT NULL THEN 'REJECT'
            WHEN T.CUR_POS = 'END' THEN 'ACCEPTED'
            ELSE 'ON PROCESS' END
            AS STATUS_TICKET,
            CASE 
				WHEN T.VALID_UNTIL < NOW() THEN true
				ELSE false 
			END AS IS_EXPIRED
        FROM TICKET T
        LEFT JOIN VENDOR V ON V.VEN_ID = T.VEN_ID
        LEFT JOIN MST_USER UR ON UR.USER_ID = T.PROC_ID ${where}
        ORDER BY T.CREATED_AT DESC, T.TICKET_ID DESC`;
            const items = await client.query(q);
            return {
                count: items.rowCount,
                data: items.rows,
            };
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            client.release();
        }
    },
    async headerTicket({ tnum: ticket_num }) {
        const client = await db.connect();
        try {
            let formhd = await client.query(
                `SELECT T.ticket_id as ticket_id, T.cur_pos, T.remarks, t.valid_until, t.ven_id as ticket_ven_id, V.*, 
                PROC.email as email_proc, PROC.role as dep_proc, MDM.email as email_mdm, MDM.role as dep_mdm, VHD.header 
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
        } finally {
            client.release();
        }
    },
    async openNew(params) {
        const client = await db.connect();
        try {
            const today = new Date();
            const until = new Date();
            const year = today.getFullYear().toString().substr(-2);
            const month = ("0" + (today.getMonth() + 1).toString()).substr(-2);
            const f_today = today.toLocaleDateString();
            until.setDate(today.getDate() + 3);
            const f_until = until.toLocaleDateString();
            const ticketid = await client.query(
                "SELECT nextval('ticket_id_seq')"
            );
            const ven_id = uuid.uuid();
            const token = uuid.uuid();
            // console.log(ticketid.rows);
            const latestnum = ticketid.rows[0].nextval;
            const headerTicket = params.to_who === "VENDOR" ? "VEN" : "PRC";
            const ticketState = params.to_who === "VENDOR" ? "INIT" : "CREA";
            const ticketNumber =
                headerTicket +
                "-" +
                year +
                month +
                String(latestnum).padStart(4, "0");
            // insert into ticket
            await client.query("BEGIN");
            const ticket = {
                ticket_id: ticketNumber,
                ven_id: ven_id,
                proc_id: params.user_id,
                valid_until: until,
                cur_pos: params.to_who,
                t_type: params.to_who,
                is_active: true,
                token: token,
                ticket_state: ticketState,
            };
            const [q, val] = crud.insertItem("TICKET", ticket, "*");
            const result = await client.query(q, val);
            await client.query("COMMIT");
            return {
                link: `frm/newform/${result.rows[0].token}`,
                token: result.rows[0].token,
            };
        } catch (err) {
            console.error(err);
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    },

    async getTicketById(ticket_num) {
        const client = await db.connect();
        try {
            const q = `SELECT T.ticket_id as ticket_num, T.token as ticket_id, T.cur_pos, T.ticket_state, T.remarks, T.ven_id as ticket_ven_id, T.t_type as t_type,
            T.reject_by as reject_by, t.is_active as ticket_stat, V.*, 
            PROC.email as email_proc, PROC.role as dep_proc, MDM.email as email_mdm, MDM.role as dep_mdm, VHD.header 
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
        } finally {
            client.release();
        }
    },

    async submitTicket(item, client) {
        try {
            const ticketq =
                await client.query(`SELECT tic.ticket_id, tic.cur_pos, tic.ticket_state, proc.department as proc, mdm.department as mdm, v.is_tender, v.name_1  from ticket tic
                        left join (select user_id, department from mst_user) proc on proc.user_id = tic.proc_id
                        left join (select user_id, department from mst_user) mdm on mdm.user_id = tic.mdm_id
                        left join vendor v on tic.ven_id = v.ven_id 
                        where tic.token = '${item.ticket_id}'`);
            const ticket = ticketq.rows[0];
            const session = ticket.ticket_state;
            const proc = ticket.proc;
            const mdm = ticket.mdm;
            const name_1 = ticket.name_1;
            let cur_pos;
            let is_active = true;
            switch (session) {
                case "INIT":
                    cur_pos = "PROC";
                    state = "CREA";
                    break;
                case "CREA":
                    if (ticket.is_tender) {
                        cur_pos = "MGR";
                    } else {
                        cur_pos = "MDM";
                    }
                    state = "FINA";
                    break;
                case "FINA":
                    is_active = false;
                    state = "END";
                    cur_pos = "END";
            }
            const q = `UPDATE ticket
                                set cur_pos = $1,
                                remarks = $2,
                                ticket_state = $3,
                                is_active = $4,
                                reject_by = null,
                                mdm_id = $5,
                                updated_at = DEFAULT
                                where ticket_id = $6
                                returning ticket_id`;
            const result = await client.query(q, [
                cur_pos,
                item.remarks,
                state,
                is_active,
                item.mdm_id,
                ticket.ticket_id,
            ]);
            return result;
        } catch (err) {
            console.error(err);
            throw err;
        }
    },

    async rejectTicket(ticket_id, remarks, role) {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const ticketq =
                await client.query(`SELECT tic.token as ticket_id, tic.ticket_id as ticket_num, tic.ticket_state, proc.department as proc, mdm.department as mdm, v.is_tender, v.name_1  from ticket tic
                        left join (select user_id, department from mst_user) proc on proc.user_id = tic.proc_id
                        left join (select user_id, department from mst_user) mdm on mdm.user_id = tic.mdm_id
                        left join vendor v on tic.ven_id = v.ven_id 
                        where tic.token = '${ticket_id}'`);
            const targets = await this.ticketTarget(ticket_id);
            const dataTrg = targets.data;
            const ticket = ticketq.rows[0];
            const session = ticket.ticket_state;
            let reject_by;
            let cur_pos;
            let ticket_state;
            switch (session) {
                case "CREA":
                    reject_by = "PROC";
                    ticket_state = "INIT";
                    cur_pos = "VENDOR";
                    break;
                // case "MGR":
                //     reject_by = "MGR";
                //     cur_pos = "PROC";
                //     break;
                case "FINA":
                    reject_by = "MDM";
                    ticket_state = "CREA";
                    cur_pos = "PROC";
                    break;
            }
            const q = `UPDATE ticket
                                set reject_by = '${reject_by}',
                                remarks =  '${remarks}',
                                cur_pos = '${cur_pos}',
                                ticket_state = '${ticket_state}',
                                updated_at = DEFAULT
                                where token = '${ticket.ticket_id}'
                                returning ticket_id`;
            if (session === "CREA") {
                await this.extendTicket(ticket.ticket_id, 3);
            }
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
        } finally {
            client.release();
        }
    },

    async ticketTarget(ticket_id) {
        const client = await db.connect();
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
            const item = await client.query(getTargetsq);
            return {
                count: item.rowCount,
                data: item.rows[0],
            };
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            client.release();
        }
    },

    async submitVendor({
        ven_detail,
        ven_banks,
        ven_files,
        ticket_id,
        remarks,
        ticket_state,
        is_draft,
        mdm_id,
        role,
    }) {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const client1 = await Vendor.setDetailVen(
                ven_detail,
                client,
                is_draft,
                ticket_state
            );
            const client2 = await Vendor.setBankRfctr(ven_banks, client);
            if (is_draft === false) {
                const client3 = await Vendor.setFileRfctr(
                    ven_detail.ven_id,
                    ven_files,
                    client
                );
                const ticket = await this.submitTicket(
                    { ticket_id: ticket_id, remarks: remarks, mdm_id: mdm_id },
                    client
                );
            }
            const targets = await this.ticketTarget(ticket_id);
            const dataTrg = targets.data;
            const res_tnum = ven_detail.ticket_num;
            if (!is_draft && ticket_state === "CREA") {
                await Emailer.toRequest(
                    ven_detail.ticket_num,
                    dataTrg.proc_fname,
                    dataTrg.proc_email,
                    [dataTrg.mgr_pr_email]
                );
                await Emailer.toMDM(
                    ven_detail.name_1,
                    ticket_id,
                    ven_detail.ticket_num,
                    ven_detail.title,
                    ven_detail.local_ovs
                );
                if (ven_detail.is_tender === true) {
                    await Emailer.toManager(
                        ven_detail.name_1,
                        ven_detail.ven_type,
                        ven_detail.company,
                        ticket_id,
                        ven_detail.description
                    );
                }
            } else if (!is_draft && ticket_state === "FINA") {
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
        } finally {
            client.release();
        }
    },

    async processMgr(ticket_id, action) {
        const client = await db.connect();
        let itemup = {};
        try {
            const checkTicket = await client.query(`
                select t.ticket_id, t.is_active, t.cur_pos,
                v.name_1, v.ven_type, v.ven_id, c.name, c.code
                from ticket t
                left join vendor v on v.ven_id = t.ven_id
                left join mst_company c on c.comp_id = v.company
                where token = '${ticket_id}'
            `);
            if (
                checkTicket.rowCount === 0 ||
                !checkTicket.rows[0].is_active ||
                checkTicket.rows[0].cur_pos != "MGR"
            ) {
                throw new Error("Ticket is not valid");
            }
            const date = new Date().toLocaleDateString();
            await client.query(TRANS.BEGIN);
            if (action === "accept") {
                itemup = {
                    cur_pos: "MDM",
                    ticket_state: "FINA",
                    updated_at: date,
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
                const updateTicket = await client.query(query, val);
            } else if (action === "reject") {
                itemup = {
                    is_active: false,
                    reject_by: "MGR",
                    updated_at: date,
                    remarks: "Rejected By Manager",
                };
            }
            await client.query(TRANS.COMMIT);
            return {
                action: action,
                ven_id: checkTicket.rows[0].ven_id,
                ticket_num: checkTicket.rows[0].ticket_id,
                name: checkTicket.rows[0].name_1,
                type: checkTicket.rows[0].ven_type,
                company: `${checkTicket.rows[0].code} - ${checkTicket.rows[0].name}`,
            };
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            console.error(error);
            throw error;
        } finally {
            client.release();
        }
    },

    async extendTicket(ticket_id, days) {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const today = new Date();
            let until = new Date();
            until.setDate(today.getDate() + days);
            const dateTicket = {
                valid_until: until,
            };
            const [q, val] = crud.updateItem(
                "TICKET",
                dateTicket,
                { token: ticket_id },
                "ticket_id"
            );
            const updateTicket = await client.query(q, val);
            await client.query(TRANS.COMMIT);
            return {
                ticket_num: updateTicket.rows[0].ticket_id,
            };
        } catch (error) {
            console.error(error);
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    },
};

module.exports = Ticket;
