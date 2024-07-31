const client = require("../config/connection");
const db = require("../config/connection");
const tgen = require("../helper/ticketnumgen");
const crud = require("../helper/crudquery");
const uuid = require("uuidv4");
const TRANS = require("../config/transaction");
const Emailer = require("./EmailModel");

const Reqstat = {
    request: async reqForm => {
        console.log(reqForm);
        try {
            const client = await db.connect();
            await client.query(TRANS.BEGIN);
            try {
                const type = reqForm.type;
                const tnum = await tgen.createTnum(
                    "ticket_reqstat_ven_id_seq",
                    "SVE"
                );
                const ticket_id = uuid.uuid();
                // request type : 1 => reactivate ; 0 => deactivate
                const dataInput = {
                    ticket_num: tnum,
                    ticket_id: ticket_id,
                    ven_id: reqForm.ven_id,
                    remarks: reqForm.remarks,
                    request: reqForm.request,
                    requestor_id: reqForm.requestor,
                    is_active: true,
                    cur_pos: "MGRPRC",
                };
                const actionEmail =
                    reqForm.request === "1" ? "Activation" : "Deactivation";
                const [q, value] = crud.insertItem(
                    "ticket_reqstat_ven",
                    dataInput,
                    "ticket_num"
                );
                const createTicket = await client.query(q, value);
                await Emailer.ApprovalDeact(
                    ticket_id,
                    reqForm.ven_id,
                    reqForm.remarks,
                    actionEmail
                );
                await client.query(TRANS.COMMIT);
                return { ticket_num: createTicket.rows[0].ticket_num };
            } catch (error) {
                await client.query(TRANS.ROLLBACK);
                console.error(error);
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },

    approvalMgr: async (ticket_id, action, remark) => {
        try {
            const client = await db.connect();
            try {
                let payload;
                if (action === "accept") {
                    payload = {
                        cur_pos: "MDM",
                    };
                } else {
                    payload = {
                        is_active: false,
                        remark: remark,
                    };
                }
                await client.query(TRANS.BEGIN);
                const { rows: dataVendor } = await client.query(
                    `select
                    trv.ticket_num,
                    concat(v.name_1, ' - ', v.ven_code) as name_1,
                    concat(c.name, ' (', c.sap_code, ')') as company,
                    trv.request,
                    trv.remarks
                from
                    ticket_reqstat_ven trv
                left join vendor v on
                    trv.ven_id = v.ven_id
                left join mst_company c on c.comp_id = v.company
                where trv.ticket_id = $1`,
                    [ticket_id]
                );
                const {
                    ticket_num,
                    name_1,
                    company,
                    request: actionReq,
                    remarks: deactRemark,
                } = dataVendor[0];
                if (action === "accept") {
                    await Emailer.toMDMApprDeact(
                        actionReq,
                        ticket_num,
                        name_1,
                        deactRemark
                    );
                }
                // else {
                //     await Emailer.rejectedApprDeact(ticket_id, remark);
                // }
                const [upQue, upVal] = crud.updateItem(
                    "ticket_reqstat_ven",
                    payload,
                    { ticket_id: ticket_id },
                    "ticket_num"
                );
                await client.query(upQue, upVal);
                await client.query(TRANS.COMMIT);
                return {
                    rejected: action == "accept" ? "approved" : "rejected",
                    actionReq:
                        actionReq == "1" ? "reactivation" : "deactivation",
                    ven_name: name_1,
                    company: company,
                };
            } catch (error) {
                await client.query(TRANS.ROLLBACK);
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },

    rejectMgr: async (ticket_id, reason) => {
        try {
            const client = await db.connect();
            try {
                const { rows: getDataTicket } = await client.query(
                    `
                     select 
                        trv.ticket_num,
                        concat(c.name, ' (', c.sap_code, ')') as company ,
                        concat(v.name_1, ' - ', v.ven_code) as name_1 ,
                        mu.email
                        from ticket_reqstat_ven trv
                        left join vendor v on v.ven_id = trv.ven_id
                        left join mst_user mu on trv.requestor_id = mu.user_id
                        left join mst_company c on c.comp_id = v.company
                        where trv.ticket_id = $1`,
                    [ticket_id]
                );
                const ticket = getDataTicket[0];
                await client.query(TRANS.BEGIN);
                const payload = {
                    is_active: false,
                    reject_remark: reason,
                };
                const [upQue, upVal] = crud.updateItem(
                    "ticket_reqstat_ven",
                    payload,
                    { ticket_id: ticket_id },
                    "ticket_num"
                );
                const rejectTicket = await client.query(upQue, upVal);
                await Emailer.rejectedApprDeact(ticket_id, reason);
                await client.query(TRANS.COMMIT);
                return {
                    ticket_num: rejectTicket.rows[0].ticket_num,
                };
            } catch (error) {
                await client.query(TRANS.ROLLBACK);
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    processReq: async (ticketid, session, action) => {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const checkTicket = await client.query(
                `select t.is_active, t.request, v.name_1, v.ven_code
                    from ticket_reqstat_ven t
                    left join vendor v on t.ven_id = v.ven_id
                where t.ticket_id = '${ticketid}'`
            );
            const name =
                checkTicket.rows[0].name_1 +
                " - " +
                checkTicket.rows[0].ven_code;
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
                respondent_id: session,
                status: action,
            };
            const [q, val] = crud.updateItem(
                "ticket_reqstat_ven",
                updateDt,
                { ticket_id: ticketid },
                "ven_id"
            );
            const updateTick = await client.query(q, val);
            if (action === "accept") {
                const ven_id = updateTick.rows[0].ven_id;
                const vendt = {
                    is_active: is_active,
                };
                //update vendor
                const [qven, valven] = crud.updateItem(
                    "vendor",
                    vendt,
                    { ven_id: ven_id },
                    "name_1"
                );
                const updateVen = await client.query(qven, valven);
                await Emailer.ApprovedApprDeact(ticketid);
            }
            await client.query(TRANS.COMMIT);
            return { name: name };
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            console.error(error);
            throw error;
        } finally {
            client.release();
        }
    },

    showAll: async query => {
        const { is_active } = query;
        const client = await db.connect();
        try {
            const q = `
                select 
                    t.ticket_id as "id",
                    t.ticket_num as "Ticket Number", 
                    TO_CHAR(t.date_ticket, 'mm/dd/yyyy') as "Date",
                    usr.email as "Requestor",
                    case
                        when t.request = 0 then 'Deactivation'
                        when t.request = 1 then 'Reactivation'
                        else 'none'
                    end
                    as "RequestDesc",
                    v.ven_code as "Vendor Code",
                    v.name_1 as "Vendor Name",
                    t.remarks as "details" 
                    from ticket_reqstat_ven t
                    left join mst_user usr on usr.user_id = t.requestor_id
                    left join vendor v on t.ven_id = v.ven_id
                    where t.is_active = ${is_active} and cur_pos = 'MDM'
            `;
            const ticketdt = await client.query(q);
            return {
                count: ticketdt.rowCount,
                data: ticketdt.rows,
            };
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            client.release();
        }
    },
};

module.exports = Reqstat;
