const db = require("../config/connection.js");
const Ticket = require("./TicketModel.js");
const { uuid } = require("uuidv4");

Vendor = {};

Vendor.showAll = () => {
    return null;
};

Vendor.newbyVendor = async params => {
    /* params contain :
        - ticket_num
        - title
        - ven_group
        - name_1
        - name_2
        - street
        - lang_key
        - telf1
        - fax
        - group_key
        - postal
        - email
        - is_pkp
        - npwp
        - pay_mthd
        - pay_term
        - is_tender
        - valid_until
        - is_active
        - local_ovs 
    */
    try {
        const today = new Date().toLocaleDateString();
        const valid_until = new Date(params.valid_until).toLocaleDateString();
        const qInsert = `insert into vendor(
        ticket_num,
        ven_id,
        ven_group, 
        ven_acc,
        title,
        name,
        local_ovs,
        limit_vendor,
        lim_curr,
        postal,
        street,
        telf1,
        fax,
        email,
        is_pkp,
        npwp,
        is_tender,
        pay_mthd,
        pay_term,
        is_tender,
        valid_until,
        created_at,
        updated_at
    ) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23)`;
        const values = [
            params.ticket_num,
            params.ven_id,
            params.ven_group,
            params.ven_acc,
            params.title,
            params.name,
            params.local_ovs,
            params.limit_vendor,
            params.lim_curr,
            params.postal,
            params.street,
            params.telf1,
            params.email,
            params.is_pkp,
            params.npwp,
            params.is_tender,
            params.pay_mthd,
            params.pay_term,
            params.is_tender,
            today,
            valid_until,
        ];
        let insertNew = await db.query(qInsert, values);
        return insertNew;
    } catch (err) {
        console.log(err.stack);
        throw err;
    }
};

module.exports = Vendor;
