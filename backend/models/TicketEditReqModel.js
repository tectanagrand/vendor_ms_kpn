const db = require("../config/connection");
const moment = require("moment");
const uuid = require("uuidv4");
const TNUMGen = require("../helper/ticketnumgen");
const Crud = require("../helper/crudquery");
const TRANS = require("../config/transaction");
const ApprovalTracker = require("../class/ApprovalTrackerClass");
const Vendor = require("./VendorModel");
const fs = require("fs");
const path = require("path");

let TicketEditReqModel = {};

//Copy all version 0 to log edit
TicketEditReqModel.BaseEditDetInitiate = async ({ ven_id, user_id }) => {
    const today = moment().format("YYYY-MM-DDTHH:mm:ss");
    try {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            //detail
            const { rows: detail_log } = await client.query(
                `
                select count(id_ticket) as ctr from log_history_edit where ven_id = $1 and version = 0
                `,
                [ven_id]
            );
            let id_ticket;
            if (detail_log[0].ctr == 0) {
                const { rows: data_origin } = await client.query(
                    `
                    select
                        v.ven_id,
                        t.token as id_ticket,
                        ven_code,
                        ven_group,
                        ven_acc,
                        ven_type,
                        title,
                        name_1,
                        name_2,
                        street,
                        lang_key,
                        telf1,
                        fax,
                        purch_org,
                        postal,
                        email,
                        npwp,
                        pay_mthd,
                        pay_term,
                        is_tender,
                        local_ovs,
                        limit_vendor,
                        lim_curr,
                        city,
                        country,
                        company,
                        is_pkp,
                        description,
                        act_remark,
                        street2,
                        search_term,
                        street_npwp,
                        street_sppkp,
                        postal_npwp,
                        postal_sppkp,
                        city_npwp,
                        city_sppkp,
                        street2_npwp,
                        street2_sppkp,
                        street3_sppkp,
                        street4_sppkp,
                        street3_npwp,
                        street4_npwp,
                        website_url,
                        ig_link,
                        fb_link,
                        twt_link,
                        nama_direktur,
                        nama_pic,
                        no_telf_pic,
                        email_pic,
                        email_fin,
                        street3,
                        street4,
                        is_priority
                    from
                        vendor v
                    left join ticket t on
                        t.ven_id = v.ven_id
                    where v.ven_id = $1
                    `,
                    [ven_id]
                );
                id_ticket = data_origin[0].id_ticket;
                const [insQue, valQue] = Crud.insertItem(
                    "log_history_edit",
                    {
                        ...data_origin[0],
                        updated_at: today,
                        updated_by: user_id,
                        version: 0,
                        changes: {},
                    },
                    "ven_code"
                );
                await client.query(insQue, valQue);
            }

            // file
            const { rows: file_vendor } = await client.query(
                `
                select count(ven_id) as ctr from log_file where ven_id = $1 and version = 0          
                `,
                [ven_id]
            );
            if (file_vendor[0].ctr == 0) {
                const { rows: ven_file } = await client.query(
                    `
                    select file_id, ven_id, file_name, file_type, desc_file
                    from ven_file_atth
                    where ven_id = $1`,
                    [ven_id]
                );
                for (const file of ven_file) {
                    const payload = {
                        ...file,
                        id_ticket: id_ticket,
                        updated_at: today,
                        updated_by: user_id,
                        version: 0,
                    };
                    const [insQue, valIns] = Crud.insertItem(
                        "log_file",
                        payload
                    );
                    await client.query(insQue, valIns);
                }
            }
            await client.query(TRANS.COMMIT);
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

//Copy all data last version to log edit
TicketEditReqModel.InitEditDet = async ({ ven_id, user_id, version }) => {
    try {
        const client = await db.connect();
        const today = moment().format("YYYY-MM-DDTHH:mm:ss");
        try {
            const { rows: last_ver } = await client.query(
                `
            select last_version from vendor where ven_id = $1
            `,
                [ven_id]
            );
            if (parseInt(last_ver[0]?.last_version) !== version - 1) {
                throw new Error("Versioning cannot be jumped");
            }

            //detail
            const { rows: checkLogExist } = await client.query(
                `
                select * from log_history_edit where ven_id = $1 and version = $2
                `,
                [ven_id, version]
            );
            if (!checkLogExist.length > 0) {
                const { rows: log_before } = await client.query(
                    `
                select * from log_history_edit where ven_id = $1 and version = $2`,
                    [ven_id, version - 1]
                );
                delete log_before[0].id;
                const payload = {
                    ...log_before[0],
                    version: version,
                    updated_at: today,
                    updated_by: user_id,
                };
                const [queLog, valLog] = Crud.insertItem(
                    "log_history_edit",
                    payload
                );
                console.log(queLog);
                await client.query(queLog, valLog);
            }
            const { rows: checkLogFileExist } = await client.query(
                `
                select * from log_history_edit where ven_id = $1 and version = $2
                `,
                [ven_id, version]
            );
            if (!checkLogFileExist.length > 0) {
                //file
                const { rows: log_file_before } = await client.query(
                    `
                select * from log_file where ven_id = $1 and version = $2`,
                    [ven_id, version - 1]
                );
                for (const file of log_file_before) {
                    delete file.id;
                    const payload = {
                        ...file,
                        version: version,
                        updated_at: today,
                        updated_by: user_id,
                    };
                    const [queFile, valFile] = Crud.insertItem(
                        "log_file",
                        payload
                    );
                    await client.query(queFile, valFile);
                }
            }

            const payload_Upven = {
                last_version: version,
            };

            const [queVen, valVen] = Crud.updateItem("vendor", payload_Upven, {
                ven_id: ven_id,
            });
            await client.query(queVen, valVen);
            await client.query(
                `
                update ven_file_atth set last_version = $1 where ven_id = $1 and bank_id is null                
                `,
                [ven_id]
            );
            await client.query(TRANS.COMMIT);
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

TicketEditReqModel.CreateNewEditDetail = async ({
    user_id,
    role,
    username,
    approval_type,
    ven_id,
}) => {
    try {
        const client = await db.connect();

        try {
            await client.query(TRANS.BEGIN);
            const { rows: lastticket } = await client.query(
                `
        select ticket_num, is_active from ticket_req_editdet where ven_id = $1 and approval_type = $2 order by index desc limit 1
        `,
                [ven_id, approval_type]
            );
            if (lastticket[0]?.is_active) {
                throw new Error("Last ticket still active");
            }
            const { rows: data_vendor } = await client.query(
                `
                select last_version from vendor where ven_id = $1                
                `,
                [ven_id]
            );
            const last_version = data_vendor[0].last_version;
            if (last_version == 0) {
                await TicketEditReqModel.BaseEditDetInitiate({
                    ven_id,
                    user_id,
                });
            }
            await TicketEditReqModel.InitEditDet({
                ven_id,
                user_id,
                version: last_version + 1,
            });
            let uid = uuid.uuid();
            const today = moment().format("YYYY-MM-DDTHH:mm:ss");
            let ticket_num = TNUMGen.GenTicketEditDetReq(username, lastticket);
            const { rows: get_approval_type } = await client.query(
                `
            select
            ad.id_doctype ,
            as2.index_approval,
            as2.disabled_input ,
            ar.id_user ,
            ar.cc_id_user
            from
            approval_doctype ad
            left join approval_steps as2 on
            ad.id_doctype = as2.id_doctype
            left join approval_role ar on
            ar.id_role = as2.id_role
            where
            ad.id_doctype = $1
            order by
            as2.index_approval asc
        `,
                [approval_type]
            );
            if (!get_approval_type.length > 0) {
                throw new Error("Approval Type not exist");
            }
            const payload = {
                uuid: uid,
                ticket_num: ticket_num,
                ven_id: ven_id,
                created_at: today,
                created_by: user_id,
                approval_type: approval_type,
                t_type: role,
                version_vendor: last_version + 1,
                is_active: true,
            };
            const [insQue, insVal] = Crud.insertItem(
                "ticket_req_editdet",
                payload,
                "ticket_num"
            );
            await client.query(insQue, insVal);
            for (const ap of get_approval_type) {
                const uid_ap = uuid.uuid();
                const payload_ap = {
                    id_ticket: uid,
                    uuid: uid_ap,
                    step_appr: ap.index_approval,
                };
                const [insApQ, insApV] = Crud.insertItem(
                    "approval_stat",
                    payload_ap,
                    "uuid"
                );
                await client.query(insApQ, insApV);
            }
            await client.query(TRANS.COMMIT);
            return {
                ticket_num: ticket_num,
                id_ticket: uid,
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

TicketEditReqModel.SubmitTicket = async ({
    psqlclient,
    ticket_id,
    user_id,
    action,
    condition_data,
}) => {
    try {
        let client = psqlclient;
        try {
            const AppTrack = new ApprovalTracker(
                client,
                ticket_id,
                condition_data
            );
            await AppTrack.init();
            const current_step = AppTrack.getCurrentStep();
            let result;

            switch (action) {
                case "submit":
                    result = await AppTrack.submitFlow(user_id);
                    break;
                case "approve":
                    result = await AppTrack.approveFlow(user_id);
                    break;
                //add email approved
                case "reject":
                    result = await AppTrack.rejectFlow(user_id);
                    break;
                //add email reject
            }

            return {
                CurrentPosition: current_step.role_name,
                Action: action,
                Result: result,
            };
        } catch (error) {
            throw error;
        }
    } catch (error) {
        throw error;
    }
};

TicketEditReqModel.SaveVendor = async ({
    psqlclient,
    data_vendor,
    edited_field,
    version,
    user_id,
    ven_id,
}) => {
    try {
        let client = psqlclient;
        const today = moment().format("YYYY-MM-DDTHH:mm:ss");
        try {
            //update data vendor
            let payload = {
                ...data_vendor,
                changes: edited_field,
                updated_at: today,
                updated_by: user_id,
            };
            const [upVen, valVen] = Crud.updateItem(
                "log_history_edit",
                payload,
                {
                    ven_id: ven_id,
                    version: version,
                }
            );
            await client.query(upVen, valVen);
            return {
                data: data_vendor,
                version: version,
            };
        } catch (error) {
            throw error;
        }
    } catch (error) {
        throw error;
    }
};

TicketEditReqModel.ProcessVendor = async ({
    data_vendor,
    data_file,
    ven_id,
    edited_field,
    version,
    user_id,
    files,
    ticket_id,
    action,
    is_draft,
}) => {
    try {
        const client = await db.connect();
        try {
            let result;
            await client.query(TRANS.BEGIN);
            if (action !== "reject") {
                result = await TicketEditReqModel.SaveVendor({
                    psqlclient: client,
                    data_vendor,
                    edited_field,
                    version,
                    user_id,
                    ven_id,
                });
            }
            if (data_file.length > 0) {
                const result_up_file = await TicketEditReqModel.ChangeFile({
                    data_file: data_file,
                    files: files,
                    id_user: user_id,
                    version: version,
                    ven_id: ven_id,
                    psqlclient: client,
                });
                result = { ...result, result_up_file };
            }
            if (!is_draft) {
                const result_ticketmove = await TicketEditReqModel.SubmitTicket(
                    {
                        psqlclient: client,
                        ticket_id,
                        user_id,
                        action,
                        condition_data: data_vendor,
                    }
                );
                result = { ...result, ...result_ticketmove };
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

TicketEditReqModel.GetById = async ({ ticket_id }) => {
    try {
        const client = await db.connect();
        try {
            const { rows: ticket_data } = await client.query(
                `
                select
                    tre.ven_id, as2.last_step_appr, tre.submitted, ar.role_name as position,
                    as3.disabled_input, v.last_version
                from
                    ticket_req_editdet tre
                left join 
                                (
                    select
                        min(step_appr) as last_step_appr,
                        id_ticket
                    from
                        approval_stat
                    where
                        status is null
                        or status = 2
                    group by
                        id_ticket
                                )
                                as2 on
                    tre.uuid = as2.id_ticket
                left join approval_steps as3 on as3.id_doctype = tre.approval_type and as2.last_step_appr = as3.index_approval 
                left join approval_role ar on ar.id_role = as3.id_role 
                left join vendor v on v.ven_id = tre.ven_id
                where tre.uuid = $1
                `,
                [ticket_id]
            );
            const ven_id = ticket_data[0].ven_id;
            const data_vendor = await Vendor.GetRevisionById(ven_id);
            return {
                ticket: ticket_data[0],
                vendor: data_vendor,
            };
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

TicketEditReqModel.GetCurrentActiveReq = async ({ user_id }) => {
    try {
        const client = await db.connect();
        try {
            const { rows: os_ticket } = await client.query(
                `
                select
                    tre.uuid,
                    tre.created_by,
                    tre.ticket_num,
                    ven_id,
                    as2.last_step_appr,
                    tre.submitted,
                    ar.role_name as cur_pos,
                    tre.is_active,
                    tre.approval_type,
                    ad.description,
                    TO_CHAR(tre.created_at, 'dd-mm-yyyy') as date_req
                from
                    ticket_req_editdet tre
                left join 
                                (
                    select
                        min(step_appr) as last_step_appr,
                        id_ticket
                    from
                        approval_stat
                    where
                        status is null
                        or status = 2
                    group by
                        id_ticket
                                )
                                as2 on
                    tre.uuid = as2.id_ticket
                left join approval_doctype ad on ad.id_doctype =tre.approval_type 
                left join approval_steps as3 on
                    as3.id_doctype = tre.approval_type
                    and as2.last_step_appr = as3.index_approval
                left join approval_role ar on
                    ar.id_role = as3.id_role
                where
                    tre.created_by = $1
                    and (submitted is null
                        or submitted = 2
                        or is_active = true
                        or last_step_appr is not null)
                `,
                [user_id]
            );
            return os_ticket;
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

TicketEditReqModel.ChangeFile = async ({
    data_file,
    files,
    id_user,
    version,
    ven_id,
    psqlclient,
}) => {
    try {
        const client = psqlclient;
        let now = moment().format("YYYY-MM-DDTHH:mm:ss");
        let id_files = [];
        try {
            for (const file of data_file) {
                let payload;
                let where;
                if (file.method === "delete") {
                    payload = {
                        changes: "delete",
                        updated_by: id_user,
                        updated_at: now,
                    };
                    where = {
                        file_id: file.id,
                        version: version,
                    };
                    const [upFile, valFile] = Crud.updateItem(
                        "log_file",
                        payload,
                        where
                    );
                    id_files.push(file.id);
                    await client.query(upFile, valFile);
                } else if (file.method === "new") {
                    //check if file id already exist
                    const { rows } = await client.query(
                        `
                        select file_id from log_file where file_id = $1
                        `,
                        [file.id]
                    );
                    if (rows.length > 0) {
                        continue;
                    }
                    const date = Date.now().toString();
                    let fileData = files[file.id][0];
                    let name = fileData.originalFilename.split(".");
                    let newName =
                        name.slice(0, -1).join(".") +
                        date +
                        "." +
                        name.slice(-1);
                    let oldPath = fileData.filepath;
                    let newPath = path.join(
                        path.resolve(),
                        "backend/public",
                        "/",
                        newName
                    );
                    let rawFile = fs.readFileSync(oldPath);
                    await fs.promises.writeFile(newPath, rawFile);
                    payload = {
                        version: version,
                        file_type: file.file_type,
                        desc_file: file.desc_file,
                        file_id: file.file_id,
                        file_name: newName,
                        changes: "new",
                        ven_id: ven_id,
                    };
                    const [insFile, valFile] = Crud.insertItem(
                        "log_file",
                        payload
                    );
                    id_files.push(file.id);
                    await client.query(insFile, valFile);
                }
            }
            return id_files;
        } catch (error) {
            throw error;
        }
    } catch (error) {
        throw error;
    }
};

TicketEditReqModel.DeleteFileTemp = async ({ file_id }) => {
    try {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const { rows } = await client.query(
                `
                select file_id, file_name from log_file where file_id = $1
                `,
                [file_id]
            );
            if (!rows.length > 0) {
                throw new Error("File not exist");
            }
            const { rows: deleteFile } = await client.query(
                `DELETE FROM log_file where file_id = $1`,
                [file_id]
            );
            const pathFile = path.join(
                path.resolve(),
                "backend/public/",
                rows[0].file_name
            );
            await fs.promises.unlink(pathFile);
            await client.query(TRANS.COMMIT);
            return {
                file: rows[0].file_name,
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

TicketEditReqModel.UnflagDelete = async ({ file_id }) => {
    try {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const { rows: checkData } = await client.query(
                `
                select changes from log_file where file_id = $1                
                `,
                [file_id]
            );
            if (!checkData[0].changes) {
                await client.query(
                    `
                    update log_file set changes = NULL where file_id = $1
                    `,
                    [file_id]
                );
            }
            await client.query(TRANS.COMMIT);
            return {
                file: file_id,
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

module.exports = TicketEditReqModel;
