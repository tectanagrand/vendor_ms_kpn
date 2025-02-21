const db = require("../config/connection");
const moment = require("moment");
const uuid = require("uuidv4");
const TRANS = require("../config/transaction");
const Crud = require("../helper/crudquery");
const ApprovalTracker = require("../class/ApprovalTrackerClass");
const { Client } = require("pg");
const EmailModel = require("./EmailModelv2");
const jwt = require("jsonwebtoken");
const Emailer = require("./EmailModel");
const Vendor = require("./VendorModel");

const ApprovalModel = {};

ApprovalModel.AddNewRole = async ({ role_name, role_code, user_id }) => {
    try {
        const client = await db.connect();
        try {
            const today = moment().format("YYYY-MM-DDTHH:mm:ss");
            await client.query(TRANS.BEGIN);
            const trimmed_rolecode = role_code.trim();
            let method = "update";
            let result = "";
            let payload = {
                role_name: role_name,
                role_code: trimmed_rolecode,
            };
            const { rows } = await client.query(
                `select role_code from mst_emp_role where role_code = $1`,
                [trimmed_rolecode]
            );
            if (rows.length == 0) {
                method = "insert";
            }

            switch (method) {
                case "insert":
                    payload.create_at = today;
                    payload.create_by = user_id;
                    const [queIns, valIns] = Crud.insertItem(
                        "mst_emp_role",
                        payload,
                        "role_name"
                    );
                    await client.query(queIns, valIns);
                    result = `Role ${role_name} successfully created`;
                    break;

                case "update":
                    payload.update_at = today;
                    payload.update_by = user_id;
                    const [queUp, valUp] = Crud.updateItem(
                        "mst_emp_role",
                        payload,
                        {
                            role_code: role_code,
                        },
                        "role_name"
                    );
                    await client.query(queUp, valUp);
                    result = `Role ${role_name} successfully updated`;
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

ApprovalModel.DeleteRole = async ({ role_code }) => {
    try {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const { rows: affected_users } = await client.query(
                `update mst_user set emp_role_id = null where emp_role_id = $1 returning username`,
                [role_code]
            );
            const { rows: affected_mgr } = await client.query(
                `update mst_mgr set emp_role_id = null where emp_role_id = $1 returning username`,
                [role_code]
            );
            await client.query(
                `delete from mst_emp_role where role_code = $1`,
                [role_code]
            );
            await client.query(TRANS.COMMIT);
            return {
                affected_users: [...affected_mgr, ...affected_users].map(
                    item => item.username
                ),
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

/**
 *
 * @param {Object} param
 * @param {string} param.id_doctype
 * @param {string} param.description
 * @param {Object[]} param.flow
 * @param {string} param.flow[].id
 * @param {string} param.flow[].index_approval
 * @param {string} param.flow[].id_role
 * @param {string} param.flow[].bu_id
 * @param {string} param.flow[].dept_id
 * @param {Object} param.flow[].on_submit
 * @param {string} param.flow[].on_submit.id
 * @param {Object[]} param.flow[].on_submit.data
 * @param {string} param.flow[].on_submit.data[].id
 * @param {string} param.flow[].on_submit.data[].group_cond
 * @param {string} param.flow[].on_submit.data[].next_index
 * @param {Object[]} param.flow[].on_submit.data[].condition
 * @param {string} param.flow[].on_submit.data[].condition[].field
 * @param {string} param.flow[].on_submit.data[].condition[].condition
 * @param {string | number | boolean} param.flow[].on_submit.data[].condition[].value
 * @param {string} param.flow[].reject_action
 * @param {numeric} param.flow[].reject_next_index
 * @param {string[] | null} param.flow[].disabled_input
 * @param {string[] | null} param.flow[].enabled_input
 * @param {string} param.flow[].default_next_index
 */

ApprovalModel.CreateApprovalFlow = async ({
    flow,
    id_doctype,
    description,
    method,
    user_id,
}) => {
    try {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const today = moment().format("YYYY-MM-DDTHH:mm:ss");
            const { rows: check_exist } = await client.query(
                `select id_doctype from approval_doctype where id_doctype = $1`,
                [id_doctype]
            );
            let payload_doctype = {
                description: description,
            };
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
                let method_flow = "update";
                const { rows: is_step_exist } = await client.query(
                    `select id from approval_steps
                    where index_approval = $1 and id_doctype = $2`,
                    [f.index_approval, id_doctype]
                );

                if (is_step_exist.length == 0) {
                    method_flow = "insert";
                }
                let id_on_submit = null;
                // create on_submit condition first
                if (f.on_submit) {
                    id_on_submit = f.on_submit.id;
                    if (!id_on_submit) {
                        id_on_submit = uuid.uuid();
                    }
                    for (const o of f.on_submit.data) {
                        let method_onsub = "update";
                        let payload_on_submit = {
                            on_submit_id: id_on_submit,
                            group_cond: o.group_cond,
                            condition: o.condition,
                            next_index: o.next_index,
                        };
                        const { rows: onsub_chk } = await client.query(
                            `select id from approval_onsubmit where group_cond = $1
                            and on_submit_id = $2`,
                            [o.group_cond, id_on_submit]
                        );

                        if (onsub_chk.length == 0) {
                            method_onsub = "insert";
                        }
                        let queOnsub, valOnsub;
                        switch (method_onsub) {
                            case "insert":
                                [queOnsub, valOnsub] = Crud.insertItem(
                                    "approval_onsubmit",
                                    payload_on_submit
                                );
                                break;
                            case "update":
                                [queOnsub, valOnsub] = Crud.updateItem(
                                    "approval_onsubmit",
                                    payload_on_submit,
                                    {
                                        group_cond: o.group_cond,
                                        on_submit_id: id_on_submit,
                                    }
                                );
                                break;
                        }
                        await client.query(queOnsub, valOnsub);
                    }
                }
                let payload = {
                    index_approval: f.index_approval,
                    emp_role_id: f.id_role,
                    bu_id: f.bu_id,
                    dept_id: f.dept_id,
                    on_submit: id_on_submit,
                    reject_action: f.reject_action,
                    reject_next_index: f.reject_next_index,
                    default_next_index: f.default_next_index,
                    disabled_input: f.disabled_input,
                    enabled_input: f.enabled_input,
                    id_doctype: id_doctype,
                };
                let queFlow, valFlow;
                if (method_flow == "insert") {
                    payload = {
                        ...payload,
                        id: uuid.uuid(),
                    };

                    [queFlow, valFlow] = Crud.insertItem(
                        "approval_steps",
                        payload,
                        "id"
                    );
                } else {
                    [queFlow, valFlow] = Crud.updateItem(
                        "approval_steps",
                        payload,
                        {
                            index_approval: f.index_approval,
                            id_doctype: id_doctype,
                        },
                        "id"
                    );
                }
                const { rows: flow_submit } = await client.query(
                    queFlow,
                    valFlow
                );
                approval_steps.push(flow_submit[0].id);
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

ApprovalModel.GetTicketFlow = async ({ ticket_id, doctype }) => {
    try {
        const client = await db.connect();
        try {
            let FlowTicket = new ApprovalTracker(client, ticket_id, doctype);
            await FlowTicket.init();
            return FlowTicket.getTicketFlow();
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

/**
 * @param {import("../class/ApprovalTrackerClass").approval_step} next_step
 * @param {import("../class/ApprovalTrackerClass").approval_step} current_step
 * @param {Client} client
 * @param {Object} misc
 * @param {string|undefined} misc.token_appr
 */

ApprovalModel.ProcessApproval = async (
    client,
    next_step,
    current_step,
    ticket_id,
    email_type,
    misc
) => {
    if (!client) {
        throw new Error("Provide client");
    }
    try {
        //update status ticket
        //check if ota (one time approval), save log if yes
        // console.log(current_step.is_onetime_appr);
        if (current_step.is_onetime_appr) {
            const ota_payload = {
                id_ticket: ticket_id,
                index_approval: current_step.index_approval,
            };
            const [insVal, insQue] = Crud.insertItem(
                "approval_store_ota",
                ota_payload
            );
            await client.query(insVal, insQue);
        }
        // throw new Error("test");
        const up_payload = {
            approval_pos: next_step.index_approval,
        };
        const [upVal, upQue] = Crud.updateItem(
            "ticket",
            up_payload,
            {
                token: ticket_id,
            },
            "ticket_id"
        );
        let { rows: up_ticket } = await client.query(upVal, upQue);
        let { rows: data_vendor } = await client.query(
            `
            select name_1, v.ven_type, mc."name" as company  from vendor v 
            left join ticket t on v.ven_id = t.ven_id
            left join mst_company mc on mc.comp_id = v.company
            where t.token = $1
            `,
            [ticket_id]
        );
        //email
        const email_target_type = current_step.def_submit_email_target;
        let email_config = { to: next_step.email };
        if (email_target_type == "PUBLIC") {
            email_config = {
                to: next_step.email,
                cc: current_step.email,
            };
        }
        await EmailModel.ProcessEmailGen(
            email_type,
            email_config,
            ticket_id,
            client,
            next_step,
            misc
        );
        return {
            message: `Ticket ${up_ticket[0].ticket_id} is updated`,
            ...data_vendor[0],
        };
    } catch (error) {
        throw error;
    }
};

ApprovalModel.EndApproval = async (client, ticket_id) => {
    try {
        const up_payload = {
            approval_pos: "END",
        };
        const [upVal, upQue] = Crud.updateItem(
            "ticket",
            up_payload,
            {
                token: ticket_id,
            },
            "ticket_id"
        );
        await client.query(upVal, upQue);
        const { rows: hostname } = await client.query(
            `
            select hostname from hostname where mode_env = $1
            `,
            [process.env.NODE_ENV]
        );
        const { rows: data_vendor } = await client.query(
            `select title, 
            name_1, 
            case 
                when local_ovs = 'LOCAL' then 'LOCAL'
                when local_ovs = 'OVS' then 'OVERSEAS'
                else ''
                end
            as local_ovs,
            t.ticket_id as ticket_num,
            v.ven_id
            from vendor v
            left join ticket t on v.ven_id = t.ven_id
            where t.token = $1
             `,
            [ticket_id]
        );
        const ven_detail = data_vendor[0];
        const { rows: verificator } = await client.query(`
            select
                string_agg(email, ',') as email
            from
                mst_mgr mm
            left join (
                select
                    distinct user_group_id,
                    user_group_name
                from
                    mst_page_access mp) mpa on
                mm.user_group = mpa.user_group_id
            where
                mpa.user_group_name = 'VERIFIC'

            `);
        const link = `${hostname[0].hostname}/dashboard/vendorverif`;
        await Emailer.RequestVerificator(
            {
                title: ven_detail.title,
                local_ovs: ven_detail.local_ovs,
                ven_name: ven_detail.name_1,
            },
            link,
            verificator[0].email
        );
        await Vendor.UploadStaging(ven_detail.ven_id, client);
        return {
            message: `Ticket ${ven_detail.ticket_num} is updated`,
            ...ven_detail,
        };
    } catch (error) {
        throw error;
    }
};

ApprovalModel.RejectApproval = async (client, ticket_id, remarks, user_id) => {
    try {
        const ApprovalTrack = new ApprovalTracker(client, ticket_id);
        await ApprovalTrack.init();
        if (!ApprovalTrack.checkIsApproverAllowed(session)) {
            throw new Error("User is not allowed");
        }
        const current_step = ApprovalTrack.current_step;
        const on_reject_action = current_step.reject_action;
        switch (on_reject_action) {
            case "deact":
                const payload_deact = {
                    is_active: false,
                };
                const [deactQue, deactVal] = Crud.updateItem(
                    "ticket",
                    payload,
                    {
                        token: ticket_id,
                    }
                );
                await client.query(deactQue, deactVal);
                break;
            case "move":
                const next_index = current_step.reject_next_index.toString();
                const payload_move = {
                    approval_pos: next_index,
                    remarks: remarks,
                };
        }
    } catch (error) {}
};

/**
 *
 * @param {Client} client
 * @param {import("../class/ApprovalTrackerClass").approval_step} next_step
 */

ApprovalModel.CreateTokenApprovalLink = async (
    client,
    next_step,
    ticket_id
) => {
    try {
        const is_wo_auth = next_step.wo_auth;
        if (!is_wo_auth) {
            return {};
        }
        const payload_token = {
            emp_role_id: next_step.emp_role_id,
            bu_id: next_step.bu_id,
            dept_id: next_step.dept_id,
            ticket_id: ticket_id,
        };

        const token_appr = jwt.sign(payload_token, process.env.TOKEN_KEY);

        const payload_db = {
            token_appr_link: token_appr,
        };

        const [upQue, upVal] = Crud.updateItem("ticket", payload_db, {
            token: ticket_id,
        });
        await client.query(upQue, upVal);
        return { token_appr: token_appr };
    } catch (error) {
        throw error;
    }
};

/**
 *
 * @param {import("../class/ApprovalTrackerClass").approval_step} current_flow
 * @param {Client} client
 */

ApprovalModel.GetNextIndexApproval = async (data, ticket_id, client) => {
    try {
        // console.log(client);
        const ApprovalTrack = new ApprovalTracker(client, ticket_id);
        await ApprovalTrack.init();
        let current_index = ApprovalTrack.current_step.index_approval;
        let skip = true;
        let next_index;
        let submit_email;
        let email_target;
        while (skip) {
            let current_step = ApprovalTrack.getApprovalStep(
                current_index.toString()
            );
            let on_sub_cond = current_step?.on_submit_condition;
            if (!on_sub_cond) {
                next_index = current_step.default_next_index;
                submit_email = current_step.def_submit_email;
                email_target = current_step.def_submit_email_target;
                skip = await ApprovalModel.CheckNextIsOTA(
                    next_index,
                    ticket_id,
                    client
                );
                if (skip) {
                    current_index = next_index;
                    continue;
                } else {
                    break;
                }
            }
            let is_change = false;
            for (let i = 0; i < on_sub_cond.length; i++) {
                if (is_change) break;
                let dt = on_sub_cond[i];
                let conditions = dt.condition;
                for (let l = 0; i < conditions.length; i++) {
                    if (is_change) break;
                    let dt_cond = conditions[l];
                    let temp_data_field = data[dt_cond.field];
                    let data_field = parseInt(temp_data_field);
                    let val_comparator = parseInt(dt_cond.value);
                    if (isNaN(data_field)) {
                        data_field = temp_data_field;
                    }
                    if (isNaN(val_comparator)) {
                        val_comparator = dt_cond.value;
                    }
                    if (data_field == undefined) {
                        throw new Error("Field data is undefined");
                    }
                    switch (dt_cond.condition) {
                        case "eq":
                            if (data_field == val_comparator) {
                                next_index = dt.next_index;
                                submit_email = dt.on_submit_email;
                                email_target = dt.on_submit_target;
                                is_change = true;
                            }
                            break;
                        case "le":
                            if (data_field <= val_comparator) {
                                next_index = dt.next_index;
                                submit_email = dt.on_submit_email;
                                email_target = dt.on_submit_target;
                                is_change = true;
                            }
                            break;
                        case "lt":
                            if (data_field < val_comparator) {
                                next_index = dt.next_index;
                                submit_email = dt.on_submit_email;
                                email_target = dt.on_submit_target;
                                is_change = true;
                            }
                            break;
                        case "ge":
                            if (data_field >= val_comparator) {
                                next_index = dt.next_index;
                                submit_email = dt.on_submit_email;
                                email_target = dt.on_submit_target;
                                is_change = true;
                            }
                            break;
                        case "gt":
                            if (data_field > val_comparator) {
                                next_index = dt.next_index;
                                submit_email = dt.on_submit_email;
                                email_target = dt.on_submit_target;
                                is_change = true;
                            }
                            break;
                    }
                }
            }
            skip = await ApprovalModel.CheckNextIsOTA(
                next_index,
                ticket_id,
                client
            );
            if (skip) {
                current_index = next_index;
                continue;
            } else {
                break;
            }
        }
        return {
            next_index,
            submit_email: submit_email,
            email_target: email_target,
        };
    } catch (error) {
        throw error;
    }
};

/**
 *
 * @param {*} next_index
 * @param {Client} client
 */

ApprovalModel.CheckNextIsOTA = async (next_index, ticket_id, client) => {
    // console.log(client);
    try {
        const { rows: next_index_data } = await client.query(
            `
            select * from approval_store_ota where id_ticket = $1 and index_approval = $2
            `,
            [ticket_id, next_index]
        );
        if (next_index_data.length > 0) {
            return true;
        }
        return false;
    } catch (error) {
        console.error(error);
    }
};

module.exports = ApprovalModel;
