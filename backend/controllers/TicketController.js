const Ticket = require("../models/TicketModel");

TicketController = {};

TicketController.openNew = async (req, res) => {
    try {
        let result = await Ticket.openNew(req.body);
        res.send({
            status: 200,
            message: `Ticket ${result} successfully created`,
        });
    } catch (err) {
        res.send({
            status: 400,
            message: err.stack,
        });
    }
};

TicketController.showAll = async (req, res) => {
    let row = await Ticket.showAll();
    let count = { count: row.rowCount, data: row.rows };
    res.send(count);
};

module.exports = TicketController;
