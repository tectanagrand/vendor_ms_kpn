const db = require("../config/connection.js");
const { TRANS } = require("../config/transaction.js");
const uuid = require("uuidv4");

const Vendor = {
    showAll() {
        return null;
    },

    async addBank(client, ven_id, banks) {
        const promise = new Promise(async (resolve, reject) => {
            try {
                if (banks.length === 0) {
                    throw new Error("Bank not inputed");
                }
                banks.map(async bank => {
                    let qInsert = `insert into ven_bank(bankv_id, ven_id, bank_id, bank_acc, acc_hold, acc_name)
                values($1, $2, $3, $4, $5, $6);`;
                    let values = [
                        uuid.uuid(),
                        ven_id,
                        bank.bank_id,
                        bank.bank_acc,
                        bank.acc_hold,
                        bank.acc_name,
                    ];
                    const insertBnk = await client.query(qInsert, values);
                });
                resolve(true);
            } catch (err) {
                // console.error(err.stack);
                reject(err);
            }
        });
        return promise;
    },

    async saveTempFile(client, ven_id) {
        const promise = new Promise(async (resolve, reject) => {
            try {
                let files = await client.query(
                    `select * from temp_ven_file_atth where ven_id = '${ven_id}'`
                );
                if (files.rows.length === 0) {
                    throw new Error("File is empty");
                }
                files.rows.map(async file => {
                    let qInsert = `insert into ven_file_atth(file_id, ven_id, file_name, file_type, created_at, created_by, desc_file)
                    values($1, $2, $3, $4, $5, $6, $7)`;
                    let values = [
                        file.file_id,
                        file.ven_id,
                        file.file_name,
                        file.file_type,
                        file.created_at,
                        file.created_by,
                        file.desc_file,
                    ];
                    const insertFile = client.query(qInsert, values);
                    const cleanTemp = await client.query(
                        `delete from temp_ven_file_atth where ven_id = '${ven_id}'`
                    );
                });
                resolve(true);
            } catch (err) {
                console.error(err.stack);
                reject(err);
            }
        });
        return promise;
    },

    async newbyVendor(params) {
        /*Flow :
    - file temporary already stored in temp_ven_file_atth, delete after move
    - bank could be multiply, map through bank object
   */
        const promise = new Promise(async (resolve, reject) => {
            const client = await db.connect();
            try {
                await client.query("BEGIN");
                const today = new Date().toLocaleDateString();
                const valid_until = new Date(
                    params.valid_until
                ).toLocaleDateString();
                //insert data vendor
                const qInsert = `insert into vendor(
            ticket_num,
            ven_id,
            ven_group,
            ven_acc,
            title,
            name_1,
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
            valid_until,
            created_at,
            updated_at
        ) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19, $20, $21, $22) returning name_1`;
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
                    params.fax,
                    params.email,
                    params.is_pkp,
                    params.npwp,
                    params.is_tender,
                    params.pay_mthd,
                    params.pay_term,
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
                let saveTempFile = await this.saveTempFile(
                    client,
                    params.ven_id
                );
                // console.log(insertNew);
                await client.query("COMMIT");
                resolve(insertNew.rows[0].name_1);
            } catch (err) {
                // console.error(err.stack);
                await client.query("ROLLBACK");
                reject(err);
            }
        });
        return promise;
    },

    async setTemp(params) {
        // console.log("hey");
        // console.log(params);
        console.log(uuid.uuid());
        const { fields, uploaded_files } = params;
        console.log(fields, uploaded_files);
        // return;
        const client = await db.connect();
        await db.query("BEGIN");
        try {
            const qInsert = `insert into temp_ven_file_atth(file_id, ven_id, file_name, file_type, created_by, desc_file)
    values($1, $2, $3, $4, $5, $6)`;
            // const { fields, upFile } = await uploadFile(params);
            // console.log(result);

            const promise = uploaded_files.map(async file => {
                let values = [
                    uuid.uuid(),
                    fields.ven_id[0],
                    file,
                    fields.file_type[0],
                    fields.created_by[0],
                    fields.desc_file[0],
                ];
                return client.query(qInsert, values);
            });
            await Promise.all(promise);
            await db.query("COMMIT");
        } catch (err) {
            await db.query("ROLLBACK");
            console.error(err.stack);
            throw err;
        }
    },

    async getFiles(params) {
        console.log(params);
        try {
            const client = await db.connect();
            const items =
                await client.query(`select file_name, desc_file, created_at from temp_ven_file_atth where ven_id = '${params}' 
            union select file_name, desc_file, created_at from ven_file_atth where ven_id = '${params}'`);
            // console.log(items);
            let result = {
                count: items.rowCount,
                data: items.rows,
            };
            return result;
        } catch (err) {
            throw err;
        }
    },
};

module.exports = Vendor;
