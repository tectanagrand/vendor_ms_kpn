const EmailModel = {};
const db = require("../config/connection");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { Client } = require("pg");
const EmailGen = require("../helper/EmailGenv2");
const mailer = require("nodemailer");

const tp = mailer.createTransport({
    host: process.env.SMTP_HOST,
    secure: true,
    port: 465,
    tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
    },
    auth: {
        user: `${process.env.SMTP_USERNAME}`,
        pass: `${process.env.SMTP_PASSWORD}`,
    },
});
/**
 * @typedef {Object} ven_detail
 * @property {string} ticket_num
 * @property {string} name_1
 *
 */
/**
 *
 * @param {Client} client
 * @returns {ven_detail}
 */

EmailModel.GetDataDetailVendor = async (client, ticket_id) => {
    try {
        const { rows: data_vendor } = await client.query(
            `
              select
                v.ven_id,
                v.ven_group,
                v.ven_acc,
                v.ven_type,
                v.title,
                v.name_1,
                v.street,
                v.street2,
                v.street3,
                v.street4,
                v.telf1,
                v.fax,
                v.purch_org ,
                v.postal,
                v.email,
                v.npwp,
                upper(v.pay_mthd) as pay_mthd ,
                concat(v.pay_term,
                ' ',
                mpt.term_name) as pay_term,
                case
                    when v.local_ovs = 'LOCAL' then 'LOCAL'
                    when v.local_ovs = 'OVS' then 'OVERSEAS'
                    else ''
                end
            as local_ovs,
                v.lim_curr,
                v.city,
                v.country,
                mc.country_name,
                concat(mc2.sap_code,
                ' ',
                mc2."name") as company,
                v.purch_org ,
                v.lim_curr ,
                v.limit_vendor ,
                v.description,
                v.is_tender, 
                v.is_priority,
                t.token as ticket_id,
                t.ticket_id as ticket_num
            from
                vendor v
            left join ticket t on
                v.ven_id = t.ven_id
            left join mst_pay_term mpt on
                mpt.term_code = v.pay_term
            left join mst_country mc on
                mc.country_code = v.country
            left join mst_company mc2 on
                mc2.comp_id = v.company
      where t.token = $1 
      `,
            [ticket_id]
        );
        if (data_vendor.length < 1) {
            throw new Error("Vendor not found");
        }
        return data_vendor[0];
    } catch (error) {
        throw error;
    }
};

/**
 *
 * @param {*} email_type
 * @param {Object} config
 * @param {string | undefined} config.to
 * @param {string | undefined} config.cc
 * @param {*} ticket_id
 * @param {Client} client
 * @param {import("../class/ApprovalTrackerClass").approval_step} next_step
 * @param {Object} misc
 * @param {string|undefined} misc.token_appr
 */

EmailModel.ProcessEmailGen = async (
    email_type,
    config,
    ticket_id,
    client,
    next_step,
    misc
) => {
    try {
        let detail_vendor = await EmailModel.GetDataDetailVendor(
            client,
            ticket_id
        );
        let html_gen = "";
        /**
         * @type {import("nodemailer").SendMailOptions}
         */
        let setup = {};
        switch (email_type) {
            case "Submit_Staff":
                html_gen = EmailGen.Submit_Staff(detail_vendor);

                setup = {
                    from: process.env.SMTP_USERNAME,
                    ...config,
                    subject: `Notification Filled User Form (${detail_vendor.ticket_num}) - ${detail_vendor.name_1}`,
                    html: html_gen,
                };
                await tp.sendMail(setup);
                break;
            case "Submit_Manager":
                await EmailModel.SendManager(
                    client,
                    next_step,
                    detail_vendor,
                    misc,
                    config
                );
                break;
            case "Submit_CLevel":
                await EmailModel.SendCLevel(
                    client,
                    next_step,
                    detail_vendor,
                    misc,
                    config
                );
                break;
            case "Submit_MDM":
                await EmailModel.SendMDM(client, detail_vendor, config);
                break;
            default:
                throw new Error("Email type not found");
                break;
        }
        return true;
    } catch (error) {
        throw error;
    }
};

EmailModel.SendManager = async (
    client,
    next_step,
    detail_vendor,
    misc,
    config
) => {
    try {
        let role_id = next_step.emp_role_id;
        let bu_id = next_step.bu_id;
        let dept_id = next_step.dept_id;

        if (!misc.token_appr) {
            throw new Error("Error generate token approval");
        }

        //get emp role_name
        const { rows: res_emp_role } = await client.query(
            `select role_name from mst_emp_role where role_code = $1`,
            [role_id]
        );
        let emp_role_name = res_emp_role[0].role_name;

        //get bu name
        const { rows: res_bu } = await client.query(
            `select bu_name from mst_bu where bu_code = $1`,
            [bu_id]
        );
        let bu_name = res_bu[0].bu_name;

        //get dept name
        const { rows: res_dept } = await client.query(
            `select dept_name from mst_department where dept_code = $1`,
            [dept_id]
        );
        let dept_name = res_dept[0].dept_name;

        const { rows: res_data_mgr } = await client.query(
            `
                select * from mst_mgr where emp_role_id = $1 and bu_id = $2 and dept_id = $3                
                `,
            [role_id, bu_id, dept_id]
        );
        let data_mgr = res_data_mgr[0];
        let title_mgr = "Bapak";
        if (data_mgr.gender == "F") {
            title_mgr = "Ibu";
        }

        const { rows: getHostname } = await client.query(
            "SELECT hostname from hostname where mode_env = $1",
            [process.env.NODE_ENV]
        );

        const hostname = getHostname[0].hostname;
        const approveLink = `${hostname}/api/ticket/mgrappr?token_appr=${misc.token_appr}`;
        const rejectLink = `${hostname}/api/ticket/mgrappr?token_appr=${misc.token_appr}`;
        let opening = `Kepada Yth. ${title_mgr} ${data_mgr.fullname} <br />Mohon approval Request Registrasi Vendor dengan detail berikut :`;

        const { rows: getBanks } = await client.query(
            `select
                          mb.bank_name ,
                          vb.bank_id,
                          vb.bank_acc,
                          vb.acc_hold,
                          vb.bank_curr,
                          vb.country
                      from
                          ven_bank vb
                      left join mst_bank_sap mb on
                          mb.id::varchar = vb.bank_id 
                      where vb.ven_id = $1 and vb.is_active = true `,
            [detail_vendor.ven_id]
        );

        const bankTable = getBanks.map(item => {
            return `
                    <tr>
                        <td>${item.country}</td>
                        <td>${item.bank_name}</td>
                        <td>${item.bank_curr}</td>
                        <td>${item.bank_acc}</td>
                        <td>${item.acc_hold}</td>
                    </tr>
                    `;
        });

        const { rows: getFiles } = await client.query(
            `select mft.file_type , vfa.file_name from  ven_file_atth vfa 
                      left join mst_file_type mft on vfa.file_type = mft.file_code 
                      where vfa.ven_id = $1`,
            [detail_vendor.ven_id]
        );

        const fileAtth = getFiles.map(item => {
            let pathStream =
                path.join(path.resolve(), "backend/public") +
                "/" +
                item.file_name;
            return {
                filename: `${item.file_type} - ${item.file_name} `,
                content: fs.createReadStream(pathStream),
            };
        });

        let html_gen = EmailGen.Submit_Manager(
            opening,
            detail_vendor,
            bankTable,
            approveLink,
            rejectLink
        );
        let setup = {
            from: process.env.SMTP_USERNAME,
            ...config,
            subject: `Vendor ${detail_vendor.name_1} ${emp_role_name} ${bu_name} ${dept_name} Approval Request (${detail_vendor.ticket_num})`,
            html: html_gen,
            attachments: fileAtth,
        };
        await tp.sendMail(setup);
    } catch (error) {
        throw error;
    }
};

EmailModel.SendCLevel = async (
    client,
    next_step,
    detail_vendor,
    misc,
    config
) => {
    try {
        let role_id = next_step.emp_role_id;
        let bu_id = next_step.bu_id;
        let dept_id = next_step.dept_id;

        if (!misc.token_appr) {
            throw new Error("Error generate token approval");
        }

        //get emp role_name
        const { rows: res_emp_role } = await client.query(
            `select role_name from mst_emp_role where role_code = $1`,
            [role_id]
        );
        let emp_role_name = res_emp_role[0].role_name;

        //get bu name
        const { rows: res_bu } = await client.query(
            `select bu_name from mst_bu where bu_code = $1`,
            [bu_id]
        );
        let bu_name = res_bu[0].bu_name;

        const { rows: res_data_mgr } = await client.query(
            `
                select * from mst_mgr where emp_role_id = $1 and bu_id = $2 and dept_id = $3                
                `,
            [role_id, bu_id, dept_id]
        );
        let data_mgr = res_data_mgr[0];
        let title_mgr = "Mr. ";
        if (data_mgr.gender == "F") {
            title_mgr = "Mrs. ";
        }

        const { rows: getHostname } = await client.query(
            "SELECT hostname from hostname where mode_env = $1",
            [process.env.NODE_ENV]
        );

        const hostname = getHostname[0].hostname;
        const approveLink = `${hostname}/api/ticket/mgrappr?token_appr=${misc.token_appr}`;
        const rejectLink = `${hostname}/api/ticket/mgrappr?token_appr=${misc.token_appr}`;

        // state = 0 => is tender
        // state = 1 => is priority
        // state = 3 => both
        let openingState = "";
        if (detail_vendor?.is_tender && !detail_vendor?.is_priority) {
            openingState = "who have participated in the tender at KPN Corp";
        } else if (!detail_vendor?.is_tender && detail_vendor?.is_priority) {
            openingState = "which is priority vendor";
        } else if (detail_vendor?.is_tender && detail_vendor?.is_priority) {
            openingState =
                "who have participated in the tender at KPN Corp also a priority vendor";
        }

        let opening = `Dear ${title_mgr} ${res_data_mgr[0].fullname}, <br /> Please approve for vendor ${openingState} :`;

        const { rows: getBanks } = await client.query(
            `select
                          mb.bank_name ,
                          vb.bank_id,
                          vb.bank_acc,
                          vb.acc_hold,
                          vb.bank_curr,
                          vb.country
                      from
                          ven_bank vb
                      left join mst_bank_sap mb on
                          mb.id::varchar = vb.bank_id 
                      where vb.ven_id = $1 and vb.is_active = true `,
            [detail_vendor.ven_id]
        );

        const bankTable = getBanks.map(item => {
            return `
                    <tr>
                        <td>${item.country}</td>
                        <td>${item.bank_name}</td>
                        <td>${item.bank_curr}</td>
                        <td>${item.bank_acc}</td>
                        <td>${item.acc_hold}</td>
                    </tr>
                    `;
        });

        const { rows: getFiles } = await client.query(
            `select mft.file_type , vfa.file_name from  ven_file_atth vfa 
                      left join mst_file_type mft on vfa.file_type = mft.file_code 
                      where vfa.ven_id = $1`,
            [detail_vendor.ven_id]
        );

        const fileAtth = getFiles.map(item => {
            let pathStream =
                path.join(path.resolve(), "backend/public") +
                "/" +
                item.file_name;
            return {
                filename: `${item.file_type} - ${item.file_name} `,
                content: fs.createReadStream(pathStream),
            };
        });

        let html_gen = EmailGen.Submit_Manager(
            opening,
            detail_vendor,
            bankTable,
            approveLink,
            rejectLink
        );
        let setup = {
            from: process.env.SMTP_USERNAME,
            ...config,
            subject: `Vendor ${detail_vendor.name_1} ${emp_role_name} ${bu_name} Approval Request (${detail_vendor.ticket_num})`,
            html: html_gen,
            attachments: fileAtth,
        };
        await tp.sendMail(setup);
    } catch (error) {
        throw error;
    }
};

/**
 * @param {Object} config
 * @param {string | undefined} config.to
 * @param {string | undefined} config.cc
 */

EmailModel.SendMDM = async (client, detail_vendor, config) => {
    try {
        // assign cc to creator
        const { rows: res_email_proc } = await client.query(`
            select mu.email from ticket t
                left join mst_user mu on t.proc_id = mu.user_id
            `);
        email_proc = res_email_proc[0].email;
        let ccemail = config?.cc;
        if (ccemail) {
            config.cc += "," + email_proc;
        } else {
            config.cc = email_proc;
        }

        const { rows: getHostname } = await client.query(
            "SELECT hostname from hostname where mode_env = $1",
            [process.env.NODE_ENV]
        );

        const hostname = getHostname[0].hostname;
        const weburl = `${hostname}/dashboard/form/${detail_vendor.ticket_id}`;
        const html_gen = EmailGen.Submit_MDM(detail_vendor, weburl);
        const setup = {
            from: process.env.SMTP_USERNAME,
            ...config,
            subject: `Vendor ${detail_vendor.name_1} Create Request (${detail_vendor.ticket_num})`,
            html: html_gen,
        };
        await tp.sendMail(setup);
    } catch (error) {
        throw error;
    }
};
module.exports = EmailModel;
