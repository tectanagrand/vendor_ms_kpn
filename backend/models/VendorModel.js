const db = require("../config/connection.js");
const { uuid } = require("uuidv4");
const uploadFile = require("../middleware/uploadFile.js");
const { TRANS } = require("../config/transaction.js");

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
        - bank {} :
            - 
    */
    /*
    Flow :
    - file temporary already stored in temp_ven_file_atth, delete after move
    - bank could be multiply, map through bank object
   */
    try {
        const client = await db.connect();
        await client.query("BEGIN");
        const today = new Date().toLocaleDateString();
        const valid_until = new Date(params.valid_until).toLocaleDateString();
        //insert data vendor
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
        $15, $16, $17, $18, $19, $20, $21, $22, $23) returning name`;
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
            today,
            valid_until,
        ];
        let insertNew = await client.query(qInsert, values);
        let insertBank = await this.addBank(
            client,
            params.ven_id,
            params.banks
        );
        let saveTempFile = await this.saveTempFile(client);
        await client.query("COMMIT");
        return insertNew.rows[0].name;
    } catch (err) {
        console.error(err.stack);
        await client.query("ROLLBACK");
        throw err;
    }
};

Vendor.addBank = async (client, ven_id, banks) => {
    try {
        banks.map(async bank => {
            let uuid = uuid();
            let qInsert = `insert into ven_bank(bankv_id, ven_id, bank_id, bank_acc, acc_hold, acc_name)
            values($1, $2, $3, $4, $5, $6);`;
            let values = [
                uuid,
                ven_id,
                bank.bank_id,
                bank.bank_acc,
                bank.acc_hold,
                bank.acc_name,
            ];
            const insertBnk = await client.query(qInsert, values);
            return true;
        });
    } catch (err) {
        console.error(err.stack);
        throw err;
    }
};

Vendor.saveTempFile = async client => {
    try {
        let files = await client.query(
            `select * from temp_ven_file_atth where ven_id = ${ven_id}`
        );
        if (files.rows.length === 0) {
            return true;
        }
        files.rows.map(async file => {
            let qInsert = `insert into ven_file_atth(file_id, ven_id, file_name, file_type, created_at, created_by, desc_file) 
            values($1, $2, $3, $4, $5, $6, $7)`;
            let values = [
                file.uuid,
                file.ven_id,
                file.file_name,
                file.file_type,
                file.created_at,
                file.created_by,
                file.desc_file,
            ];
            const insertFile = client.query(qInsert, values);
            insertFile
                .then(async result => {
                    const cleanTemp = await client.query(
                        `delete from temp_ven_file_atth where ven_id = ${ven_id}`
                    );
                })
                .catch(reject => {
                    throw reject;
                });
            return true;
        });
    } catch (err) {
        console.error(err.stack);
        throw err;
    }
};

Vendor.setTempFile = async params => {
    console.log(params);
    const client = await db.connect();
    await db.query(TRANS.BEGIN);
    try {
        const qInsert = `insert into temp_ven_file_atth(file_id, ven_id, file_name, file_type, created_by, desc_file)
        values($1, $2, $3, $4, $5, $6)`;
        const result = await uploadFile(params);
        console.log(result);
        upFile.map(async file => {
            let uuid = uuid();
            let values = [
                uuid,
                fields.ven_id,
                file,
                fields.file_type,
                fields.created_by,
                fields.desc_file,
            ];
            let insertFile = await client.query(qInsert, upFile);
        });
        await db.query(TRANS.COMMIT);
    } catch (err) {
        await db.query(TRANS.ROLLBACK);
        console.error(err.stack);
        throw err;
    }
};
module.exports = Vendor;
