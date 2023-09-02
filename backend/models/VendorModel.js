const db = require("../config/connection");
const TRANS = require("../config/transaction");
const uuid = require("uuidv4");
const crud = require("../helper/crudquery");

const Vendor = {
    async showAll() {
        try {
            const client = await db.connect();
            const q = `SELECT V.TICKET_NUM,
                            V.VEN_ID,
                            V.VEN_CODE,
                            V.CREATED_AT,
                            V.NAME_1,
                            V.VEN_CODE,
                            TI.cur_pos,
                            TI.is_active,
                            TI.is_reject
                        FROM VENDOR V
                        LEFT JOIN TICKET TI ON V.TICKET_NUM = TI.TICKET_ID
                        `;
            const result = await client.query(q);
            return {
                count: result.rowCount,
                data: result.rows,
            };
        } catch (err) {
            console.error(err);
            throw err;
        }
    },

    async addBank(client, ven_id, banks) {
        const promise = new Promise(async (resolve, reject) => {
            try {
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
                    resolve(true);
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

    async setDetailVen(detail, client) {
        /*Flow :
    - file temporary already stored in temp_ven_file_atth, delete after move
    - bank could be multiple, map through bank object
   */
        const promise = new Promise(async (resolve, reject) => {
            let q, value;
            try {
                const isExist = await client.query(
                    `SELECT * FROM VENDOR WHERE ven_id = '${detail.ven_id}'`
                );
                const today = new Date().toLocaleDateString();
                const valid_until = new Date(
                    detail.valid_until
                ).toLocaleDateString();
                detail.valid_until = valid_until;
                detail.updated_at = today;
                detail.created_at = today;
                if (isExist.rowCount != 0) {
                    [q, value] = crud.updateItem(
                        "VENDOR",
                        detail,
                        {
                            col: ven_id,
                            value: detail.ven_id,
                        },
                        "name_1"
                    );
                } else {
                    [q, value] = crud.insertItem("VENDOR", detail, "name_1");
                }
                let insertNew = await client.query(q, value);
                // console.log(insertNew);
                // return;
                // console.log(insertNew);
                resolve(insertNew.rows[0].name_1);
            } catch (err) {
                await client.query(TRANS.ROLLBACK);
                console.error(err.stack);
                reject(err);
            }
        });
        return promise;
    },

    async setTemp(params) {
        const { fields, uploaded_files } = params;
        let data = [];
        // return;
        const client = await db.connect();
        await db.query("BEGIN");
        try {
            const qInsert = `insert into temp_ven_file_atth(file_id, ven_id, file_name, file_type, created_by, desc_file)
    values($1, $2, $3, $4, $5, $6) returning file_id, file_name, desc_file, 'temp_ven_file_atth' as source, 'insert' as method`;
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
            const result = await Promise.all(promise);
            await db.query("COMMIT");
            result.map(item => {
                data.push(item.rows[0]);
            });
            return data;
        } catch (err) {
            await db.query("ROLLBACK");
            console.error(err.stack);
            throw err;
        }
    },

    async getFiles(ven_id) {
        try {
            const client = await db.connect();
            const items =
                await client.query(`select file_name, desc_file, created_at, 'temp_ven_file_atth' as tbl_src from temp_ven_file_atth 
                where ven_id = '${ven_id}' 
            union select file_name, desc_file, created_at, 'ven_file_atth' as tbl_src from ven_file_atth where ven_id = '${ven_id}'`);
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

    async getBank(ven_id) {
        try {
            const client = await db.connect();
            const items = await client.query(
                `SELECT * FROM VEN_BANK WHERE VEN_ID = '${ven_id}'`
            );
            // console.log(items);
            let result = {
                count: items.rowCount,
                data: items.rows,
            };
            return result;
        } catch (err) {
            console.error(err);
            throw err;
        }
    },

    async setBank(banks, client) {
        let method;
        let q;
        let val;
        const promises = banks.map(async bank => {
            method = bank.method;
            delete bank.method;
            switch (method) {
                case "insert":
                    bank.bankv_id = uuid.uuid();
                    [q, val] = crud.insertItem("VEN_BANK", bank);
                    return client.query(q, val);

                case "update":
                    [q, val] = crud.updateItem("VEN_BANK", bank, {
                        col: "bankv_id",
                        value: bank.bankv_id,
                    });
                    return client.query(q, val);

                case "delete":
                    q = crud.deleteItem("VEN_BANK", "bankv_id", bank.bankv_id);
                    return client.query(q);
            }
        });
        const promise = new Promise(async (resolve, reject) => {
            Promise.all(promises)
                .then(async result => {
                    resolve(true);
                })
                .catch(async err => {
                    console.error(err.stack);
                    reject(err);
                });
        });
        return promise;
    },

    async setFile(files, client) {
        let method;
        let q;
        let val;
        let data;
        let ven_id;
        let cleanTemp = false;
        const promises = files.map(async file => {
            method = file.method;
            delete file.method;
            switch (method) {
                case "insert":
                    if (!cleanTemp) {
                        cleanTemp = true;
                        ven_id = file.ven_id;
                    }
                    data = await client.query(
                        `SELECT file_id, ven_id, file_name, file_type, created_at, created_by, desc_file FROM TEMP_VEN_FILE_ATTH WHERE file_id = '${file.file_id}'`
                    );
                    [q, val] = crud.insertItem("VEN_FILE_ATTH", data.rows[0]);
                    return client.query(q, val);

                case "update":
                    [q, val] = crud.updateItem("VEN_FILE_ATTH", file, {
                        col: "file_id",
                        value: file.file_id,
                    });
                    return client.query(q, val);

                case "delete":
                    q = crud.deleteItem(
                        "VEN_FILE_ATTH",
                        "file_id",
                        file.file_id
                    );
                    return client.query(q);
            }
        });
        const promise = new Promise(async (resolve, reject) => {
            Promise.all(promises)
                .then(async result => {
                    if (cleanTemp) {
                        q = crud.deleteItem(
                            "TEMP_VEN_FILE_ATTH",
                            "ven_id",
                            ven_id
                        );
                        try {
                            await client.query(q);
                        } catch (err) {
                            reject(err);
                        }
                    }
                    resolve(true);
                })
                .catch(async err => {
                    console.error(err.stack);
                    reject(err);
                });
        });
        return promise;
    },

    /*
     There will be :
     - setter : setDetailVen, setBankVen, setFileVen, setTempFileVen
     - getter : getDetailVen, getBankVen, getFileVen => fetch from each table
     - process : Submit
        =>  Submit : promise all setDetailVen, setBankVen, setFileVen

     -setDetailVen : 
        expected input :
            {
                {ven_id : <ven_id>,
                ... fields for detail vendor}
            }
        expected output :
            boolean
    -setBankVen :
        expected input :
            [
                {
                    mode : <insert, update, delete>,
                    bank_id : <bank_id>,
                    ... fields for bank
                }
                ... array of object bank
            ]
        expected output :
            boolean
    -setFileVen :
        expected input :
            [
                {
                    mode : <insert, delete>,
                    file_id : <file_id>,
                    ... fields for file
                }
                ...array of object file
            ]
        expected output :
            boolean
    -setTempFileVen :
        expected input : multiform 
        expected output :
        [
            {
                mode : insert
                file_id : <file_id>,
                file_name : <file_name>,
                desc_file : <desc_file>
            }
        ]
    */
};

module.exports = Vendor;
