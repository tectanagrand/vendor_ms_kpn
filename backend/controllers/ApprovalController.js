const ApprovalModel = require("../models/ApprovalModel");

const ApprovalController = {};

ApprovalController.AddNewRole = async (req, res) => {
    try {
        const { id_role, role_name, id_users, cc_users } = req.body;
        const { user_id } = req.cookies;
        const result = await ApprovalModel.AddNewRole({
            id_role,
            role_name,
            id_users,
            cc_users,
            user_id: user_id,
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
        const { id_role } = req.body;
        const result = await ApprovalModel.DeleteRole({ id_role });
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
        const { flow, id_doctype, method } = req.body;
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

module.exports = ApprovalController;
