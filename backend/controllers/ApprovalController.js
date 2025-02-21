const ApprovalModel = require("../models/ApprovalModel");

const ApprovalController = {};

ApprovalController.AddNewRole = async (req, res) => {
    try {
        const { role_name, role_code } = req.body;
        const { user_id } = req.cookies;
        const result = await ApprovalModel.AddNewRole({
            role_name,
            role_code,
            user_id,
        });
        res.status(200).send({
            message: result,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

ApprovalController.DeleteRole = async (req, res) => {
    try {
        const { role_code } = req.body;
        const result = await ApprovalModel.DeleteRole({ role_code });
        res.status(200).send({
            data: result,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

/**
 *
 * @param {import("express").Request} req
 * @param {*} res
 */

ApprovalController.CreateNewFlow = async (req, res) => {
    /*
    @ Types
    flow : [
        {
            id_approval : "" | id
            index_approval : num
            id_role : id
        }

    ]
    id_doctype : name of flow
    user_id : current session 
    */
    try {
        const { flow, id_doctype } = req.body;
        const method = req.method == "POST" ? "insert" : "update";
        const { user_id } = req.cookies;
        const result = await ApprovalModel.CreateApprovalFlow({
            flow,
            id_doctype,
            method,
            user_id,
        });
        res.status(200).send({
            data: result,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

ApprovalController.GetTicketFlow = async (req, res) => {
    try {
        const { ticket_id, doctype } = req.query;
        console.log(req.query);
        const data = await ApprovalModel.GetTicketFlow({ ticket_id, doctype });
        res.status(200).send({ data: data });
        return;
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

module.exports = ApprovalController;
