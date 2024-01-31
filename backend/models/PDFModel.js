const pdf = require("pdfkit");
const db = require("../config/connection");
const Ticket = require("./TicketModel");

const PDF = {
    exportPDF: async ven_id => {
        try {
            const vendorData = await Ticket.getTicketById(ven_id);
            console.log(vendorData);
        } catch (error) {
            throw error;
        }
    },
};

module.exports = PDF;
