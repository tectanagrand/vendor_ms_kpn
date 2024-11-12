const db = require("../config/connection");
const moment = require("moment");
const uuid = require("uuidv4");
const TRANS = require("../config/transaction");
const Crud = require("../helper/crudquery");

const ApprovalModel = {};

ApprovalModel.AddNewRole = async ({
    id_role,
    role_name,
    id_users,
    cc_users,
    user_id,
}) => {
    try {
        const client = await db.connect();
        try {
            const today = moment().format("YYYY-MM-DDTHH:mm:ss");
            await client.query(TRANS.BEGIN);
            let method = "update";
            let result = "";
            let payload = {
                role_name: role_name,
                id_user: id_users,
                cc_id_user: cc_users,
            };
            if (!id_role) {
                method = "insert";
                payload.id_role = uuid.uuid();
                const { rows: check_exist } = await client.query(
                    `SELECT role_name from approval_role where role_name = $1`,
                    [role_name]
                );
                if (check_exist.length > 0) {
                    throw new Error("Role Name already exist");
                }
            }

            switch (method) {
                case "insert":
                    payload.created_at = today;
                    payload.created_by = user_id;
                    const [queIns, valIns] = Crud.insertItem(
                        "approval_role",
                        payload,
                        "role_name"
                    );
                    const { rows: insert_role } = await client.query(
                        queIns,
                        valIns
                    );
                    result = `Role ${insert_role[0].role_name} successfully created`;
                    break;

                case "update":
                    payload.updated_at = today;
                    payload.updated_by = user_id;
                    const [queUp, valUp] = Crud.updateItem(
                        "approval_role",
                        payload,
                        {
                            id_role: id_role,
                        },
                        "role_name"
                    );
                    const { rows: update_role } = await client.query(
                        queUp,
                        valUp
                    );
                    result = `Role ${update_role[0].role_name} successfully updated`;
                    break;
            }

            await client.query(TRANS.COMMIT);
            return result;
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

ApprovalModel.DeleteRole = async ({ id_role }) => {
    try {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const que = `delete from approval_role where id_role = $1`;
            await client.query(que, [id_role]);
            const get_rel_appr = `select id_doctype, index_approval from approval_steps where id_role = $1`;
            const { rows: rel_appr } = await client.query(get_rel_appr, [
                id_role,
            ]);
            if (!rel_appr.length > 0) {
                await client.query(TRANS.COMMIT);
                return {
                    affected_doctype: [],
                };
            }
            for (const dt of rel_appr) {
                const { rows: next_steps } = await client.query(
                    `select index_approval, id_approval from approval_steps where id_doctype = $1 and index_approval > $2`,
                    [dt["id_doctype"], parseInt(dt["index_approval"])]
                );
                if (!next_steps.length > 0) {
                    continue;
                }
                for (const step of next_steps) {
                    const up_step = {
                        index_approval: parseInt(step["index_approval"]) - 1,
                    };
                    const [queUp, valUp] = Crud.updateItem(
                        "approval_steps",
                        up_step,
                        {
                            id_approval: step["id_approval"],
                        },
                        "id_approval"
                    );
                    await client.query(queUp, valUp);
                }
            }
            await client.query(TRANS.COMMIT);
            return {
                affected_doctype: rel_appr.map(item => item.id_doctype),
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
};

ApprovalModel.CreateApprovalFlow = async ({
    flow,
    id_doctype,
    method,
    user_id,
}) => {
    /*
    @ Types
    flow : [
        {
            id_approval : "" | id
            index_approval : num
            id_role : id
            id_doctype : name of doctype
            disabled_input : [name of field | all]
        }

    ]
    id_doctype : name of flow
    user_id : current session 
    */
    try {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const today = moment().format("YYYY-MM-DDTHH:mm:ss");
            let payload_doctype = {};
            const { rows: check_exist } = await client.query(
                `select id_doctype from approval_doctype where id_doctype = $1`,
                [id_doctype]
            );
            if (check_exist.length > 0 && method === "insert") {
                throw new Error("Doctype name already taken");
            }
            if (check_exist.length < 0 && method === "update") {
                throw new Error(
                    "Cannot change doctype name, doctype name is key"
                );
            }
            let queDoc, valDoc;
            if (method === "insert") {
                payload_doctype = {
                    ...payload_doctype,
                    id_doctype: id_doctype,
                    created_at: today,
                    created_by: user_id,
                };
                [queDoc, valDoc] = Crud.insertItem(
                    "approval_doctype",
                    payload_doctype,
                    "id_doctype"
                );
            } else {
                payload_doctype = {
                    ...payload_doctype,
                    updated_at: today,
                    updated_by: user_id,
                };
                [queDoc, valDoc] = Crud.updateItem(
                    "approval_doctype",
                    {
                        id_doctype: id_doctype,
                    },
                    payload_doctype,
                    "id_doctype"
                );
            }
            const { rows: doctype_submit } = await client.query(queDoc, valDoc);
            let approval_steps = [];
            for (const f of flow) {
                let payload = {
                    index_approval: f.index_approval,
                    id_role: f.id_role,
                    action: f.action,
                    disabled_input: f.disabled_input,
                    inbound_condition: f.inbound_condition,
                };
                let queFlow, valFlow;
                if (method === "insert") {
                    payload = {
                        ...payload,
                        id_approval: uuid.uuid(),
                        id_doctype,
                    };

                    [queFlow, valFlow] = Crud.insertItem(
                        "approval_steps",
                        payload,
                        "id_approval"
                    );
                } else {
                    [queFlow, valFlow] = Crud.updateItem(
                        "approval_steps",
                        payload,
                        {
                            id_doctype: id_doctype,
                            index_approval: f.index_approval,
                        },
                        "id_approval"
                    );
                }
                const { rows: flow_submit } = await client.query(
                    queFlow,
                    valFlow
                );
                approval_steps.push(flow_submit[0].id_approval);
            }
            await client.query(TRANS.COMMIT);
            return {
                doctype: id_doctype,
                approval_steps: approval_steps,
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
};

module.exports = ApprovalModel;
