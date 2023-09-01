const db = require("../config/connection");
const uuid = require("uuidv4");
const TRANS = require("../config/transaction");
const crud = require("../helper/crudquery");

const Ticket = {
    async showAll() {
        try {
            const client = await db.connect();
            const items = await client.query(
                `SELECT T.*,
                    V.NAME_1,
                    V.VEN_CODE,
                    UR.EMAIL
                FROM TICKET T
                LEFT JOIN VENDOR V ON V.VEN_ID = T.VEN_ID
                LEFT JOIN MST_USER UR ON UR.USER_ID = T.PROC_ID
                ORDER BY T.CREATED_AT DESC`
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
    async headerTicket(params) {
        try {
            let formhd = await db.query(
                `SELECT proc.fullname, proc.email, proc.department, t.ticket_id, t.is_active, t.ven_id, t.cur_pos, r.reject_by
                from mst_user proc 
                    left join ticket t on t.proc_id = proc.user_id 
                where t.ticket_id = '${params.tnum}'`
            );
            if (formhd.rows[0].is_active === false) {
                throw { message: `Ticket ${params.tnum} is inactive` };
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
        until.setDate(today.getMonth() + 1);
        const f_until = until.toLocaleDateString();
        const ticketid = await db.query(
            "SELECT id FROM ticket order by id desc"
        );
        const ven_id = uuid.uuid();
        // console.log(ticketid.rows);
        const latestnum =
            Number(ticketid.rows.length != 0 ? ticketid.rows[0].id : 0) + 1;

        const ticketNumber =
            "VMS-" + year + month + String(latestnum).padStart(4, "0");

        try {
            // insert into ticket
            const client = await db.connect();
            await client.query("BEGIN");
            const ticket = {
                ticket_id: ticketNumber,
                ven_id: ven_id,
                proc_id: params.user_id,
                valid_until: f_until,
                cur_pos: "VENDOR",
                is_active: true,
                token: uuid.uuid(),
            };
            const [q, val] = crud.insertItem("TICKET", ticket, "ticket_id");
            const result = await client.query(q, val);
            await client.query("COMMIT");
            return result.rows[0].ticket_id;
        } catch (err) {
            console.error(err);
            await client.query("ROLLBACK");
            throw err;
        }
    },

    async getTicketById(ticket_num) {
        try {
            const client = await db.connect();
            const q = `SELECT T.*,
                                V.NAME_1,
                                V.VEN_CODE,
                                UR.EMAIL
                            FROM TICKET T
                            LEFT JOIN VENDOR V ON V.VEN_ID = T.VEN_ID
                            LEFT JOIN MST_USER UR ON UR.USER_ID = T.PROC_ID
                            WHERE T.TICKET_ID = ${ticket_num}
                            ORDER BY T.CREATED_AT DESC`;
            const item = await client.query(q);
            return {
                count: item.rowCount,
                data: item.rows,
            };
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    },

    async submitTicket(ticket_id, client) {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await client.query(TRANS.BEGIN);
                const ticketq =
                    await client.query(`SELECT tic.ticket_id, tic.cur_pos, proc.department as proc, mdm.department, v.is_tender as mdm from ticket tic
                        left join (select user_id, department from mst_user) proc on proc.user_id = tic.proc_id
                        left join (select user_id, department from mst_user) mdm on mdm.user_id = tic.mdm_id
                        left join vendor v on tic.ven_id = v.ven_id 
                        where tic.ticket_id = '${ticket_id}'`);
                const ticket = ticketq.rows[0];
                const session = ticket.cur_pos;
                const proc = ticket.proc;
                const mdm = ticket.mdm;
                let cur_pos;
                switch (session) {
                    case "VENDOR":
                        cur_pos = proc;
                        break;
                    case "PROC":
                        if (ticket.is_tender) {
                            cur_pos = "MGR";
                        } else {
                            cur_pos = mdm;
                        }
                        break;
                    case "MDM":
                        cur_pos = "END";
                }
                const q = `UPDATE ticket
                                set cur_pos = '${cur_pos}',
                                updated_at = DEFAULT
                                where ticket_id = '${ticket.ticket_id}'
                                returning ticket_id`;
                const upTick = await client.query(q);
                await client.query(TRANS.COMMIT);
                await client.end();
                resolve(upTick.rows[0].ticket_id);
            } catch (err) {
                await client.query(TRANS.ROLLBACK);
                await client.end();
                console.error(err);
                reject(err);
            }
        });
        return promise;
    },
};

module.exports = Ticket;
