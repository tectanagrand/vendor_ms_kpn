const mailer = require("nodemailer");
const Email = require("../helper/generateemail");
const db = require("../config/connection");

const tp = mailer.createTransport({
    host: process.env.SMTP_HOST,
    secure: false,
    secureConnection: false,
    port: process.env.SMTP_PORT,
    tls: {
        rejectUnAuthorized: true,
    },
    auth: {
        user: `${process.env.SMTP_USERNAME}`,
        pass: `${process.env.SMTP_PASSWORD}`,
    },
});

const Emailer = {
    toManager: async (ven_name, ven_type, comp, ticket_id, description) => {
        const getData = await db.query(
            `select name, code from mst_company where comp_id = '${comp}'`
        );
        const company = getData.rows[0].code + " - " + getData.rows[0].name;
        const transporter = tp;
        try {
            const setup = {
                from: process.env.SMTP_USERNAME,
                to: "rtektano@gmail.com",
                subject: `${ven_name} - ${comp} - Request Approval Vendor`,
                html: Email.manager(
                    ven_name,
                    ven_type,
                    company,
                    ticket_id,
                    description
                ),
            };
            const send = await transporter.sendMail(setup);
            return send;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    toRequest: async (ticket_num, requestor, target, cc) => {
        const transporter = tp;
        const cc_email = cc.join(",");
        try {
            const setup = {
                from: process.env.SMTP_USERNAME,
                to: target,
                cc: cc_email,
                subject: `New Ticket Request - ${ticket_num}`,
                html: Email.request(ticket_num, requestor),
            };
            const send = await transporter.sendMail(setup);
            return send;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    toApprove: async (ven_code, ven_name, target, cc) => {
        const transporter = tp;
        const cc_email = cc.join(",");
        try {
            const setup = {
                from: process.env.SMTP_USERNAME,
                to: target,
                cc: cc_email,
                subject: `Vendor ${ven_code} - ${ven_name} Approval Notification`,
                html: Email.approve(ven_code, ven_name),
            };
            const send = await transporter.sendMail(setup);
            return send;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    toReject: async (reason, ven_name, target, cc) => {
        const transporter = tp;
        const cc_email = cc.join(",");
        try {
            const setup = {
                from: process.env.SMTP_USERNAME,
                to: target,
                cc: cc_email,
                subject: `Vendor ${ven_name} Reject Notification`,
                html: Email.reject(reason),
            };
            const send = await transporter.sendMail(setup);
            return send;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
};

module.exports = Emailer;
