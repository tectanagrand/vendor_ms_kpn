const TRANS = require("../config/transaction");
const Ticket = require("../models/TicketModel");
const Vendor = require("../models/VendorModel");
const db = require("../config/connection");

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
        const row = await Ticket.showAll();
        res.status(200).send({
            status: 200,
            data: row,
        });
    } catch (err) {
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
        } = req.body;
        let res_tnum, name_1, rest;
        // console.log(req.body);
        //change ticket cur_pos
        await client.query(TRANS.BEGIN);
        let promises = [];
        if (!is_draft) {
            promises.push(
                Ticket.submitTicket(
                    { ticket_id: ticket_id, remarks: remarks },
                    client
                )
            );
        }
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
                // console.log(result);
                // return;
                [[res_tnum, name_1], ...rest] = result;
                res.status(200).send({
                    status: 200,
                    message: !is_draft
                        ? `${
                              name_1 ? name_1 : ven_detail.name_1
                          } Vendor with num ticket : ${res_tnum} has been requested`
                        : `${ticket_id} Ticket draft has been saved`,
                    data: req.body,
                });
            })
            .catch(async err => {
                res.status(500).send({
                    status: 500,
                    message: err.message,
                });
                await client.query(TRANS.ROLLBACK);
                console.error(err.stack);
            });
        await client.query(TRANS.COMMIT);
    } catch (err) {
        await client.query(TRANS.ROLLBACK);
        res.status(500).send({
            status: 500,
            message: err.message,
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
        await client.end();
    }
};

TicketController.rejectTicket = async (req, res) => {
    const params = req.body;
    try {
        const [ticket_id, reject_by] = await Ticket.rejectTicket(
            params.ticket_id
        );
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
module.exports = TicketController;
