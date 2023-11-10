const client = require("../config/connection");
const db = require("../config/connection");
const tgen = require("../helper/ticketnumgen");
const crud = require("../helper/crudquery");
const uuid = require("uuidv4");
const TRANS = require("../config/transaction");

const Reqstat = {
    request: async reqForm => {
        db.query(TRANS.BEGIN);
        try {
            const type = reqForm.type;
            const tnum = await tgen.createTnum(
                "ticket_reqstat_ven_id_seq",
                "SVE"
            );
            // request type : 1 => reactivate ; 0 => deactivate
            const dataInput = {
                ticket_num: tnum,
                ticket_id: uuid.uuid(),
                ven_id: reqForm.ven_id,
                remarks: reqForm.remarks,
                request: reqForm.request,
                requestor_id: reqForm.requestor,
                is_active: true,
            };

            const [q, value] = crud.insertItem(
                "ticket_reqstat_ven",
                dataInput,
                "ticket_num"
            );
            const createTicket = await db.query(q, value);
            db.query(TRANS.COMMIT);
            return { ticket_num: createTicket.rows[0].ticket_num };
        } catch (error) {
            db.query(TRANS.ROLLBACK);
            console.error(error);
            throw error;
        }
    },

    processReq: async (ticketid, session) => {
        try {
            const checkTicket = await db.query(
                `select is_active, request from ticket_reqstat_ven where ticket_id = '${ticketid}'`
            );
            const requestType = parseInt(checkTicket.rows[0].request);
            let is_active;
            switch (requestType) {
                case 0:
                    is_active = false;
                    break;
                case 1:
                    is_active = true;
                    break;
            }
            if (checkTicket.rowCount == 0) {
                throw new Error("Ticket not exist");
            }
            if (checkTicket.rows[0].is_active == false) {
                throw new Error("Ticket is not active");
            }
            const updateDt = {
                is_active: false,
                respondent_id: session.id,
            };
            const [q, val] = crud.updateItem(
                "ticket_reqstat_ven",
                updateDt,
                { col: "ticket_id", value: ticketid },
                "ven_id"
            );
            const updateTick = await db.query(q, val);
            const ven_id = updateTick.rows[0].ven_id;
            const vendt = {
                is_active: is_active,
            };
            //update vendor
            const [qven, valven] = crud.updateItem(
                "vendor",
                updateVen,
                { ven_id: ven_id },
                "name_1"
            );
            const updateVen = await db.query(qven, valven);
            return { name: updateVen.rows[0].name_1 };
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    showAll: async () => {
        try {
            const q = `
                select t.ticket_num, 
                    t.remarks, 
                    t.request, 
                    usr.fullname, 
                    usr.email 
                    from ticket_reqstat_ven
                    left join mst_user usr on usr.user_id = t.requestor_id
            `;
            const ticketdt = await db.query(q);
            return {
                count: ticketdt.rowCount,
                data: ticketdt.rows,
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
};

module.exports = Reqstat;
