const db = require("../config/connection");
const { uuid } = require("uuidv4");

Ticket = {
    async showAll() {
        let items = await db.query(
            `SELECT * FROM ticket T left join vendor V on V.ven_id = T.ven_id`
        );
        return items;
    },
    async headerTicket(params) {
        console.log(params);
        try {
            let formhd = await db.query(
                `SELECT proc.fullname, proc.email, proc.department, t.ticket_id, t.is_active, t.ven_id
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
        const ven_id = uuid();
        // console.log(ticketid.rows);
        const latestnum =
            Number(ticketid.rows.length != 0 ? ticketid.rows[0].id : 0) + 1;

        const ticketNumber =
            "VMS-" + year + month + String(latestnum).padStart(4, "0");

        try {
            // insert into ticket
            const client = await db.connect();
            await client.query("BEGIN");
            const query_tick = `INSERT INTO ticket(ticket_id, ven_id, proc_id, created_at, valid_until, cur_pos, is_active, is_reject)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) returning ticket_id`;
            values = [
                ticketNumber,
                ven_id,
                params.USER_ID,
                f_today,
                f_until,
                "VENDOR",
                true,
                false,
            ];
            const result = await client.query(query_tick, values);
            console.log(result);
            await client.query("COMMIT");
            return result.rows[0].ticket_id;
        } catch (err) {
            console.error(err);
            await client.query("ROLLBACK");
            throw err;
        }
    },
};

// Ticket.showAll = async () => {
//     let items = await db.query(
//         `SELECT * FROM ticket T left join vendor V on V.ven_id = T.ven_id`
//     );
//     return items;
// };

// Ticket.headerTicket = async params => {
//     console.log(params);
//     try {
//         let formhd = await db.query(
//             `SELECT proc.fullname, proc.email, proc.department, t.ticket_id, t.is_active
//             from mst_user proc
//                 left join ticket t on t.proc_id = proc.user_id
//             where t.ticket_id = '${params.tnum}'`
//         );
//         if (formhd.rows[0].is_active === false) {
//             throw { message: `Ticket ${params.tnum} is inactive` };
//         }
//         return formhd.rows[0];
//     } catch (err) {
//         console.log(err);
//         throw err;
//     }
// };

// Ticket.openNew = async params => {
//     const today = new Date();
//     const until = new Date();
//     const year = today.getFullYear().toString().substr(-2);
//     const month = ("0" + (today.getMonth() + 1).toString()).substr(-2);
//     const f_today = today.toLocaleDateString();
//     until.setDate(today.getMonth() + 1);
//     const f_until = until.toLocaleDateString();
//     const ticketid = await db.query("SELECT id FROM ticket order by id desc");
//     const ven_id = uuid();
//     // console.log(ticketid.rows);
//     const latestnum =
//         Number(ticketid.rows.length != 0 ? ticketid.rows[0].id : 0) + 1;

//     const ticketNumber =
//         "VMS-" + year + month + String(latestnum).padStart(4, "0");

//     try {
//         // insert into ticket
//         const client = await db.connect();
//         await client.query("BEGIN");
//         const query_tick = `INSERT INTO ticket(ticket_id, ven_id, proc_id, created_at, valid_until, cur_pos, is_active, is_reject)
//         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) returning ticket_id`;
//         values = [
//             ticketNumber,
//             ven_id,
//             params.USER_ID,
//             f_today,
//             f_until,
//             "VENDOR",
//             true,
//             false,
//         ];
//         const result = await client.query(query_tick, values);
//         console.log(result);
//         await client.query("COMMIT");
//         return result.rows[0].ticket_id;
//     } catch (err) {
//         console.error(err);
//         await client.query("ROLLBACK");
//         throw err;
//     }
// };

module.exports = Ticket;
