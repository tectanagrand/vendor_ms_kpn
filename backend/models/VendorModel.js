const db = require("../config/connection");
const TRANS = require("../config/transaction");
const uuid = require("uuidv4");
const crud = require("../helper/crudquery");
const os = require("os");
const path = require("path");
const fs = require("fs");

const Vendor = {
    async showAll({ isactive, limit, start }) {
        try {
            const client = db;
            let q = `SELECT V.VEN_ID as id, V.NAME_1 as VEN_NAME, V.VEN_CODE, V.ACT_REMARK, V.IS_ACTIVE,
                        T.REMARKS, T.TICKET_ID
                        FROM VENDOR V 
                        LEFT JOIN TICKET_REQSTAT_VEN T ON T.VEN_ID = V.VEN_ID AND T.IS_ACTIVE = true
                        WHERE V.is_active is not null`;

            if (isactive != "") {
                q += ` and V.is_active = ${isactive}`;
            }
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

    async setDetailVen(detail, client, is_draft, ticket_state) {
        /*Flow :
    - file temporary already stored in temp_ven_file_atth, delete after move
    - bank could be multiple, map through bank object
   */
        try {
            const isExist = await client.query(
                `SELECT * FROM VENDOR WHERE ven_id = '${detail.ven_id}'`
            );
            const today = new Date().toLocaleDateString();
            if ("valid_until" in detail) {
                const valid_until = new Date(
                    detail.valid_until
                ).toLocaleDateString();
                detail.valid_until = valid_until ? valid_until : null;
            }
            detail.updated_at = today;
            detail.created_at = today;
            if (isExist.rowCount != 0) {
                if (is_draft === false && ticket_state === "FINA") {
                    detail.is_active = true;
                }
                [q, value] = crud.updateItem(
                    "VENDOR",
                    detail,
                    { ven_id: detail.ven_id },
                    "*"
                );
            } else {
                [q, value] = crud.insertItem("VENDOR", detail, "*");
                // return;
            }
            const submitTicket = await client.query(q, value);
            return client;
        } catch (err) {
            console.log(err);
            throw err;
        }
    },

    async setTemp(params) {
        const { fields, uploaded_files } = params;
        let data = [];
        // return;
        const client = await db.connect();
        await client.query("BEGIN");
        try {
            const qInsert = `insert into temp_ven_file_atth(file_id, ven_id, file_name, file_type, created_by, desc_file)
    values($1, $2, $3, $4, $5, $6) returning ven_id, file_id, file_name, desc_file, file_type, 'temp_ven_file_atth' as source, 'insert' as method`;
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
            await client.query("COMMIT");
            result.map(item => {
                data.push(item.rows[0]);
            });
            return data;
        } catch (err) {
            await client.query("ROLLBACK");
            console.error(err.stack);
            throw err;
        } finally {
            client.release();
        }
    },

    async deleteTemp({ id, ven_id }) {
        if (id !== "") {
            try {
                const client = db;
                await db.query("BEGIN");
                const q =
                    "DELETE FROM temp_ven_file_atth where file_id = $1 returning file_name ;";
                const result = await client.query(q, [id]);
                const file_name = result.rows[0].file_name;
                if (os.platform() == "linux") {
                    await fs.promises.unlink(
                        path.join(path.resolve(), "backend/public") +
                            "/" +
                            file_name
                    );
                } else {
                    await fs.promises.unlink(
                        path.join(path.resolve(), "backend\\public") +
                            "\\" +
                            file_name
                    );
                }
                await db.query("COMMIT");
                return result.rows[0];
            } catch (err) {
                throw err;
            }
        } else {
            try {
                const client = db;
                await db.query("BEGIN");
                const q =
                    "DELETE FROM temp_ven_file_atth where ven_id = $1 returning file_name ;";
                const result = await client.query(q, [ven_id]);
                result.rows.forEach(async item => {
                    const fileName = item.file_name;
                    try {
                        await fs.promises.unlink(
                            path.join(path.resolve(), "backend\\public") +
                                "\\" +
                                fileName
                        );
                    } catch (error) {
                        throw error;
                    }
                });
                await db.query("COMMIT");
                return result.rows;
            } catch (err) {
                throw err;
            }
        }
    },

    async getFiles(ven_id) {
        try {
            const client = db;
            const items =
                await client.query(`select file_id, file_name, desc_file, file_type, created_at, 'temp_ven_file_atth' as source from temp_ven_file_atth 
                where ven_id = '${ven_id}' 
            union select file_id, file_name, desc_file, file_type, created_at, 'ven_file_atth' as source from ven_file_atth where ven_id = '${ven_id}'`);
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
            const client = db;
            const items = await client.query(
                `SELECT v.bankv_id as id, v.bank_id, v.bank_acc, v.acc_hold, v.acc_name, b.bank_key,
                b.bank_key|| '-' || b.bank_name as bank_name, v.bank_curr, v.country, b.source
                FROM VEN_BANK V
                LEFT JOIN MST_BANK_SAP B ON v.bank_id = b.bank_key
                WHERE VEN_ID = '${ven_id}'`
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
        if (banks.length === 0) {
            return client;
        }
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
                        bankv_id: bank.bankv_id,
                    });
                    return client.query(q, val);

                case "delete":
                    q = crud.deleteItem("VEN_BANK", "bankv_id", bank.bankv_id);
                    return client.query(q);
            }
        });
        const promise = Promise.all(promises)
            .then(async result => {
                return client;
            })
            .catch(async err => {
                console.error(err.stack);
                throw err;
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
        if (files.length === 0) {
            return client;
        }
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
                    if (data.rowCount === 0) {
                        break;
                    }
                    [q, val] = crud.insertItem("VEN_FILE_ATTH", data.rows[0]);
                    return client.query(q, val);

                case "delete":
                    if (os.platform === "win32") {
                        await fs.promises.unlink(
                            path.join(path.resolve(), "backend\\public") +
                                "\\" +
                                file.file_name
                        );
                    } else {
                        await fs.promises.unlink(
                            path.join(path.resolve(), "backend/public") +
                                "/" +
                                file.file_name
                        );
                    }
                    q = crud.deleteItem(
                        "VEN_FILE_ATTH",
                        "file_id",
                        file.file_id
                    );
                    return client.query(q);
            }
        });
        const promise = Promise.all(promises)
            .then(async result => {
                q = crud.deleteItem("TEMP_VEN_FILE_ATTH", "ven_id", ven_id);
                try {
                    await client.query(q);
                    return client;
                } catch (error) {
                    throw err;
                }
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
        return promise;
    },

    async getHeaderCode({ local_ovs, ven_acc, ven_type, ven_group }) {
        const promise = new Promise(async (resolve, reject) => {
            const q = `SELECT HEADER FROM VEN_CODE_HD WHERE local_ovs='${local_ovs}' and ven_acc='${ven_acc}' and ven_type='${ven_type}' and ven_group='${ven_group}'`;
            try {
                const headercode = await db.query(q);
                resolve({ status: true, header: headercode.rows[0] });
            } catch (err) {
                reject({ status: false, message: "Header not found" });
            }
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
