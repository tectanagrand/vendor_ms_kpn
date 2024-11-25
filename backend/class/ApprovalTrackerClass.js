const db = require("../config/connection");
const TRANS = require("../config/transaction");
const Crud = require("../helper/crudquery");
const moment = require("moment");

class ApprovalTracker {
    ticket_id = "";
    approval_step;
    current_step;
    end_index;
    data_cond;
    psqlclient;

    constructor(client, id_ticket, data_cond) {
        if (!id_ticket) throw new Error("ticket id not defined");
        if (!client) throw new Error("Please set pg client");
        this.ticket_id = id_ticket;
        this.data_cond = data_cond;
        this.psqlclient = client;
    }

    async init() {
        try {
            let client = this.psqlclient;
            try {
                const que = `
                select
                    id_ticket,
                    tre.submitted,
                    as3.id_role,
                    as2.step_appr,
                    as2.status,
                    aru.id_user,
                    ar.role_name,
                    tre.created_by
                from
                    approval_stat as2
                left join ticket_req_editdet tre on
                    as2.id_ticket = tre."uuid"
                left join approval_steps as3 on
                    as3.id_doctype = tre.approval_type and as2.step_appr = as3.index_approval 
                left join approval_role ar on
                    ar.id_role = as3.id_role
                left join (select array_agg(id_user)as id_user, id_role from approval_role_user group by id_role) aru on aru.id_role = ar.id_role
                where id_ticket = $1
                order by as2.step_appr asc
                `;
                const { rows: approval_step_dt } = await client.query(que, [
                    this.ticket_id,
                ]);
                if (approval_step_dt.length < 1) {
                    throw new Error("Ticket Not Found");
                }
                this.approval_step = approval_step_dt;
                this.end_index = approval_step_dt.length - 1;
                // console.log(this.approval_step);
                const current = approval_step_dt.findIndex(
                    item => item.status == null || item.status == 2
                );
                // console.log(current);
                if (approval_step_dt[current].status == 2 && current > 0) {
                    this.current_step = approval_step_dt[current - 1];
                    this.current_step.current_status = "2";
                } else {
                    this.current_step = approval_step_dt[current];
                    this.current_step.current_status =
                        approval_step_dt[current].status;
                }
                return;
            } catch (error) {
                throw error;
            }
        } catch (error) {
            throw error;
        }
    }

    checkIsInit() {
        if (!(this.ticket_id && this.approval_step && this.current_step)) {
            throw new Error("Class not initiated yet");
        }
    }

    checkIsApproverAllowed(id_user) {
        this.checkIsInit();
        if (!id_user) {
            throw new Error("Please provide id user");
        }
        if (this.current_step.id_user.includes(id_user)) {
            return true;
        }
        return false;
    }

    getCurrentStep() {
        return this.current_step;
    }

    getApprovalStep() {
        return this.approval_step;
    }

    async submitFlow(id_user) {
        try {
            let client = this.psqlclient;
            try {
                const today = moment().format("YYYY-MM-DDTHH:mm:ss");
                let payload = {
                    submitted: 1,
                    updated_at: today,
                    updated_by: id_user,
                };
                let where = {
                    uuid: this.ticket_id,
                };
                const [subTicQ, valSub] = Crud.updateItem(
                    "ticket_req_editdet",
                    payload,
                    where
                );
                await client.query(subTicQ, valSub);
                return {
                    next_step: this.current_step.role_name,
                };
            } catch (error) {
                console.error(error);
                throw error;
            }
        } catch (error) {
            throw error;
        }
    }

    async checkInboundCondition(condition, step_index) {
        /*
        eq : Equal to (==)
        gt : Greater than (>)
        lt : Less than (<)

        condition structure :
        [
            {
                field : <name of field>
                condition : {
                    <eq/gt/lt> : <value>
                }
            }
        ]
        */
        try {
            let client = this.psqlclient;
            try {
                let condition_ok = true;
                for (const dt of condition) {
                    if (!condition_ok) {
                        continue;
                    }
                    const value = this.data_cond[dt.field];
                    for (const keys of Object.keys(dt.condition)) {
                        if (!condition_ok) {
                            continue;
                        }
                        switch (keys) {
                            case "eq":
                                if (value != dt.condition[keys]) {
                                    condition_ok = false;
                                }
                                break;
                            case "gt":
                                if (!value > dt.condition[keys]) {
                                    condition_ok = false;
                                }
                                break;
                            case "lt":
                                if (!value < dt.condition[keys]) {
                                    condition_ok = false;
                                }
                                break;
                        }
                    }
                }
                if (!condition_ok) {
                    const [upQue, valQue] = Crud.updateItem(
                        "approval_stat",
                        { status: 3 },
                        { id_ticket: this.ticket_id, step_appr: step_index }
                    );
                    await client.query(upQue, valQue);
                }
                return condition_ok;
            } catch (error) {
                throw error;
            }
        } catch (error) {
            throw error;
        }
    }

    async approveFlow(id_user) {
        try {
            if (this.current_step.submitted !== 1) {
                throw new Error("Ticket is not submitted yet");
            }
            if (!this.checkIsApproverAllowed(id_user)) {
                throw new Error("Approver is not allowed");
            }
            let client = this.psqlclient;
            const today = moment().format("YYYY-MM-DDTHH:mm:ss");
            let next_step;
            try {
                if (
                    this.current_step.current_status == 2 &&
                    this.current_step.step_appr + 1 <=
                        this.approval_step.length - 1
                ) {
                    let payload = {
                        status: null,
                        current_remark: "",
                    };
                    let where = {
                        id_ticket: this.ticket_id,
                        step_appr: this.current_step.step_appr + 1,
                    };
                    const [upNext, valNext] = Crud.updateItem(
                        "approval_stat",
                        payload,
                        where
                    );
                    await client.query(upNext, valNext);
                }
                let payload = {
                    status: 1,
                    updated_at: today,
                    updated_by: id_user,
                };
                let where = {
                    id_ticket: this.ticket_id,
                    step_appr: this.current_step.step_appr,
                };
                const [upNext, valNext] = Crud.updateItem(
                    "approval_stat",
                    payload,
                    where
                );
                await client.query(upNext, valNext);
                //check next condition

                if (this.current_step.step_appr + 1 <= this.end_index) {
                    next_step =
                        this.approval_step[this.current_step.step_appr + 1];
                    while (next_step?.inbound_condition) {
                        if (
                            !this.checkInboundCondition(
                                next_step.inbound_condition,
                                next_step.step_appr
                            )
                        ) {
                            if (next_step.step_appr + 1 !== this.end_index) {
                                next_step =
                                    this.approval_step[next_step.step_appr + 1];
                            } else {
                                next_step = { step_appr: "END" };
                            }
                        }
                    }
                } else {
                    next_step = {
                        role_name: "END",
                    };
                }
                return {
                    next_step: next_step.role_name,
                };
            } catch (error) {
                throw error;
            }
        } catch (error) {
            throw error;
        }
    }
    async rejectFlow(id_user) {
        try {
            if (!this.checkIsApproverAllowed(id_user)) {
                throw new Error("Approver is not allowed");
            }
            if (this.current_step.submitted !== 1) {
                throw new Error("Ticket is not submitted yet");
            }
            const client = this.psqlclient;
            try {
                let payload = {
                    status: 2,
                };
                let where = {
                    id_ticket: this.ticket_id,
                    step_appr: this.current_step.step_appr,
                };
                const [upNext, valNext] = Crud.updateItem(
                    "approval_stat",
                    payload,
                    where
                );
                if (this.current_step.step_appr === 0) {
                    let payload = {
                        submitted: 0,
                    };
                    let where = {
                        id_ticket: this.ticket_id,
                    };
                    const [unSubq, valUnsubq] = Crud.updateItem(
                        "ticket_req_editdet",
                        payload,
                        where
                    );
                    await client.query(unSubq, valUnsubq);
                }
                await client.query(upNext, valNext);
                return {
                    next_step:
                        this.approval_step[this.current_step.step_appr - 1]
                            .role_name,
                };
            } catch (error) {
                throw error;
            }
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ApprovalTracker;
