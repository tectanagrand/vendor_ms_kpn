const db = require("../config/connection");
const uuid = require("uuidv4");
const TRANS = require("../config/transaction");

Ticket = {
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
        console.log(params);
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
            console.log(err);
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
            const query_tick = `INSERT INTO ticket(ticket_id, ven_id, proc_id, created_at, valid_until, cur_pos, reject_by, is_active, token)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) returning ticket_id`;
            values = [
                ticketNumber,
                ven_id,
                params.USER_ID,
                f_today,
                f_until,
                "VENDOR",
                null,
                true,
                uuid.uuid(),
            ];
            const result = await client.query(query_tick, values);
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

    // async deleteTicket(ticket_num) {
    //     try {
    //         const client = await db.connect();
    //         //check ticket current position
    //         let q;
    //         const t_stat = client.query(
    //             `SELECT CUR_POS, REJECT_BY FROM TICKET WHERE TICKET_ID = '${ticket_num}'`
    //         );
    //         const cur_pos = t_stat.rows[0].cur_pos;
    //         const reject_by = t_stat.rows[0].reject_by;
    //         //delete ticket

    //         await client.query(TRANS.BEGIN);
    //     } catch (err) {}
    // },
};

module.exports = Ticket;
