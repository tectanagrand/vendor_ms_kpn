const formidable = require("formidable");
const TicketEditReqModel = require("../models/TicketEditReqModel");

let TicketEditReqController = {};

TicketEditReqController.CreateNewEditDetail = async (req, res) => {
    try {
        const { ven_id } = req.body;
        const { user_id, username } = req.cookies;
        const result = await TicketEditReqModel.CreateNewEditDetail({
            user_id,
            username,
            approval_type: "EDIT_DETAIL_VENDOR",
            ven_id,
        });
        res.status(200).send({
            message: `Ticket ${result.ticket_num} successfully created`,
            data: result,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TicketEditReqController.GetByID = async (req, res) => {
    try {
        const { id } = req.query;
        const data = await TicketEditReqModel.GetById({ ticket_id: id });
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

// TicketEditReqController.SubmitTicket = async (req, res) => {
//     try {
//         const { action, id_ticket } = req.body;
//         const { user_id } = req.cookies;
//         const result = await TicketEditReqModel.SubmitTicket({
//             ticket_id: id_ticket,
//             user_id,
//             action,
//         });
//         res.status(200).send(result);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send({
//             message: error.message,
//         });
//     }
// };

TicketEditReqController.ProcessVendor = async (req, res) => {
    try {
        // const {
        //     data_vendor,
        //     data_file,
        //     ven_id,
        //     edited_field,
        //     version,
        //     ticket_id,
        //     action,
        //     is_draft,
        // } = req.body;
        const formParser = new formidable.IncomingForm();
        const [fields, items] = await formParser.parse(req);
        const { user_id } = req.cookies;
        const isdraft = fields.is_draft[0] == "true";
        const payload = {
            data_vendor: JSON.parse(fields.data_vendor[0]),
            data_file: JSON.parse(fields.data_file[0]),
            ven_id: fields.ven_id[0],
            edited_field: JSON.parse(fields.edited_field[0]),
            version: fields.version[0],
            ticket_id: fields.ticket_id[0],
            action: fields.action[0],
            is_draft: isdraft,
            files: items,
            user_id,
        };

        const result = await TicketEditReqModel.ProcessVendor(payload);
        let resultMessage;
        if (isdraft) {
            resultMessage = `Draft saved !`;
        } else {
            resultMessage = "Ticket Submitted";
        }
        res.status(200).send({
            data: result,
            message: resultMessage,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TicketEditReqController.GetCurrentActiveReq = async (req, res) => {
    try {
        const { user_id } = req.cookies;
        const data = await TicketEditReqModel.GetCurrentActiveReq({ user_id });
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

TicketEditReqController.DeleteFileTemp = async (req, res) => {
    try {
        const { file_id } = req.body;
        const result = await TicketEditReqModel.DeleteFileTemp({ file_id });
        res.status(200).send({
            message: "Temporary File Deleted",
            data: result,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};
TicketEditReqController.UnflagDelete = async (req, res) => {
    try {
        const { file_id } = req.body;
        const result = await TicketEditReqModel.UnflagDelete({ file_id });
        res.status(200).send({
            message: "File Unflagged Delete",
            data: result,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

module.exports = TicketEditReqController;
