const TRANS = require("../config/transaction");
const Ticket = require("../models/TicketModel");
const Vendor = require("../models/VendorModel");

const TicketController = {};

TicketController.openNew = async (req, res) => {
    try {
        let result = await Ticket.openNew(req.body);
        res.status(200).send({
            status: 200,
            message: `Ticket ${result} successfully created`,
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
        const result = await Ticket.getTicketById(req.params.t_num);
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
    try {
        //expected input :
        /*
            {
                ticket_id :
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
        const { ticket_id, ven_detail, ven_banks, ven_files } = req.body;
        //change ticket cur_pos
        const client = db.connect();
        await client.query(TRANS.BEGIN);
        let promises = [];
        promises.push(Ticket.submitTicket(ticket_id, client));
        if (ven_detail != null) {
            promises.push(Ticket.setDetailVen(ven_detail, client));
        }
        if (ven_banks.length != 0) {
            promises.push(Vendor.setBank(ven_banks, client));
        }
        if (ven_files.length != 0) {
            promises.push(Vendor.setFile(ven_files, client));
        }

        const [res_tnum, name_1, ,] = Promise.all(promises);

        res.status(200).send({
            status: 200,
            message: `${res_tnum} Vendor with num ticket : ${name_1} has been requested`,
        });
    } catch (err) {
        res.status(500).send({
            status: 500,
            message: err.stack,
        });
    }
};
module.exports = TicketController;
