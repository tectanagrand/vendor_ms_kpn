const db = require("../config/connection");
const TRANS = require("../config/transaction");
const uuid = require("uuidv4");
const crud = require("../helper/crudquery");
const os = require("os");
const path = require("path");
const fs = require("fs");
const moment = require("moment");

const Vendor = {
    async showAll({ isactive, limit, start }) {
        const client = await db.connect();
        try {
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
        } finally {
            client.release();
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
                    const insertFile = await client.query(qInsert, values);
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

    async setDetailVen(detail, client, is_draft, ticket_state, edited_fields) {
        /*Flow :
    - file temporary already stored in temp_ven_file_atth, delete after move
    - bank could be multiple, map through bank object
   */
        try {
            const isExist = await client.query(
                `SELECT * FROM VENDOR WHERE ven_id = '${detail.ven_id}'`
            );
            let payloadEdit;
            const { rows: getStatusTicket } = await client.query(
                `select reject_by, is_draft from ticket where ven_id = $1`,
                [detail.ven_id]
            );
            // const is_draftdb = getStatusTicket[0].is_draft;
            // const last_ver = isExist.rows[0].last_version;
            const today = new Date();
            if ("valid_until" in detail) {
                const valid_until = new Date(
                    detail.valid_until
                ).toLocaleDateString();
                detail.valid_until = valid_until ? valid_until : null;
            }
            detail.updated_at = moment(today).format("YYYY-MM-DD");
            detail.created_at = moment(today).format("YYYY-MM-DD");
            if (isExist.rowCount != 0) {
                if (is_draft === false && ticket_state === "FINA") {
                    detail.is_active = true;
                }
                // if (!is_draftdb) {
                //     detail.last_version = parseInt(last_ver) + 1;
                //     payloadEdit.version = parseInt(last_ver) + 1;
                // } else {
                //     payloadEdit.version = parseInt(last_ver);
                // }

                // for(const edited of edited_fields) {

                // }
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
        let promises = [];
        let data = [];
        // return;
        const client = await db.connect();
        await client.query("BEGIN");
        try {
            const qInsert = `insert into temp_ven_file_atth(file_id, ven_id, file_name, file_type, created_by, desc_file)
    values($1, $2, $3, $4, $5, $6) returning ven_id, file_id, file_name, desc_file, file_type, 'temp_ven_file_atth' as source, 'insert' as method`;
            // const { fields, upFile } = await uploadFile(params);
            // console.log(result);

            // const promise = uploaded_files.map(async file => {
            //     let values = [
            //         uuid.uuid(),
            //         fields.ven_id[0],
            //         file,
            //         fields.file_type[0],
            //         fields.created_by[0],
            //         fields.desc_file[0],
            //     ];
            //     return client.query(qInsert, values);
            // });
            for (const file of uploaded_files) {
                let values = [
                    uuid.uuid(),
                    fields.ven_id[0],
                    file,
                    fields.file_type[0],
                    fields.created_by[0],
                    fields.desc_file[0],
                ];
                promises.push(client.query(qInsert, values));
            }
            const result = await Promise.all(promises);
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
        const client = await db.connect();
        await client.query("BEGIN");
        if (id !== "") {
            try {
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
                await client.query("COMMIT");
                return result.rows[0];
            } catch (err) {
                client.query(TRANS.ROLLBACK);
                throw err;
            } finally {
                client.release();
            }
        } else {
            try {
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
                await client.query("COMMIT");
                return result.rows;
            } catch (err) {
                client.query(TRANS.ROLLBACK);
                throw err;
            } finally {
                client.release();
            }
        }
    },

    async deleteFile({ id }) {
        try {
            const client = await db.connect();
            try {
                await client.query(TRANS.BEGIN);
                const q =
                    "DELETE FROM ven_file_atth where file_id = $1 returning file_name ;";
                const { rows } = await client.query(q, [id]);
                const file_name = rows[0].file_name;
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
                await client.query("COMMIT");
                return rows[0];
            } catch (error) {
                await client.query(TRANS.ROLLBACK);
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },

    async getFiles(ven_id) {
        const client = await db.connect();
        try {
            const items =
                await client.query(`select file_id, file_name, ty.file_type as desc_file, tmp.file_type, created_at, 'temp_ven_file_atth' as source from temp_ven_file_atth tmp
                left join mst_file_type ty on ty.file_code = tmp.file_type
                where ven_id = '${ven_id}' and tmp.file_type not in ('A001', 'A002') 
            union select file_id, file_name,ty.file_type as desc_file, fl.file_type, created_at, 'ven_file_atth' as source from ven_file_atth fl
            left join mst_file_type ty on ty.file_code = fl.file_type
            where ven_id = '${ven_id}' and fl.file_type not in ('A001', 'A002')`);
            // console.log(items);
            let result = {
                count: items.rowCount,
                data: items.rows,
            };
            return result;
        } catch (err) {
            throw err;
        } finally {
            client.release();
        }
    },
    async getBank(ven_id) {
        const client = await db.connect();
        try {
            const items = await client.query(
                `SELECT distinct v.id as order_id, v.bankv_id as id, v.bank_id, v.bank_acc, v.acc_hold, v.acc_name, 
                b.id as bank_id, b.bank_name, b.bank_code, b.bank_key, v.bank_curr, v.country, b.source,
                case
                    when acl.file_type = 'A001' then acl.file_name
                    else ''
                    end as account_statement_letter,
                case
                    when acl.file_type = 'A001' then acl.file_id
                    else ''
                    end as account_statement_letter_id,
                case
                    when pbk.file_type = 'A002' then pbk.file_name
                    else ''
                    end as passbook,
                    case
                    when pbk.file_type = 'A002' then pbk.file_id
                    else ''
                    end as passbook_id
                FROM VEN_BANK V
                LEFT JOIN MST_BANK_SAP B ON v.bank_id = b.id::varchar
                LEFT JOIN ven_file_atth acl on acl.bank_id = v.bankv_id and acl.file_type = 'A001'
                LEFT JOIN ven_file_atth pbk on pbk.bank_id = v.bankv_id and pbk.file_type = 'A002'
                WHERE v.is_active = true and v.VEN_ID = '${ven_id}'
                order by order_id asc`
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
        } finally {
            client.release();
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

    async setBankRfctr(banks, client, ven_id) {
        let promises = [];
        let method;
        let q, val;
        try {
            for (let bank of banks) {
                method = bank.method;
                const payload = {
                    ven_id: ven_id,
                    bank_id: bank.bank_id,
                    bank_acc: bank.bank_acc,
                    country: bank.bank_country,
                    bank_curr: bank.bank_curr,
                    acc_hold: bank.acc_hold,
                };
                switch (method) {
                    case "insert":
                        payload.bankv_id = bank.id;
                        [q, val] = crud.insertItem("VEN_BANK", payload);
                        promises.push(client.query(q, val));
                        break;
                    case "update":
                        [q, val] = crud.updateItem("VEN_BANK", payload, {
                            bankv_id: bank.id,
                        });
                        promises.push(client.query(q, val));
                        break;
                }
            }
            const returnPromise = await Promise.all(promises);
            return returnPromise;
        } catch (error) {
            console.error(error.stack);
            throw error;
        }
    },

    async deleteBankVen(id) {
        try {
            const client = await db.connect();
            try {
                await client.query(TRANS.BEGIN);
                const payload = {
                    is_active: false,
                    updated_at: moment().format("YYYY-MM-DDTHH:mm:ss"),
                };
                const [upQue, upVal] = crud.updateItem(
                    "ven_bank",
                    payload,
                    { bankv_id: id },
                    "bank_acc"
                );
                const { rows } = await client.query(upQue, upVal);
                await client.query(TRANS.COMMIT);
                return { bank_acc: rows[0].bank_acc };
            } catch (error) {
                await client.query(TRANS.ROLLBACK);
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
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

    async setFileRfctr(vendor_id, files, client) {
        let method;
        let q;
        let val;
        let data;
        let ven_id;
        let cleanTemp = false;
        let promises = [];
        let files_id = [];
        let restfile = "";
        for (let file of files) {
            files_id.push(`'${file.file_id}'`);
        }
        if (files.length > 0) {
            restfile = `and file_id not in (${files_id.join(", ")})`;
        }
        getTempFiles = await client.query(
            `select 
                file_id, 
                ven_id, 
                file_name, 
                file_type, 
                created_at, 
                created_by, 
                desc_file,
                'insert' as method 
                from temp_ven_file_atth where ven_id = '${vendor_id}' ${restfile}`
        );
        tempFiles = getTempFiles.rows;
        let file_toUp = [...files, ...tempFiles];
        if (files.length === 0) {
            return client;
        }
        try {
            for (let file of file_toUp) {
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
                        [q, val] = crud.insertItem(
                            "VEN_FILE_ATTH",
                            data.rows[0]
                        );
                        promises.push(client.query(q, val));
                        break;
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
                        promises.push(client.query(q));
                        break;
                }
            }
            const promise = await Promise.all(promises);
            q = crud.deleteItem("TEMP_VEN_FILE_ATTH", "ven_id", ven_id);
            const deleteTemp = await client.query(q);
            return promise;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },

    async getHeaderCode({ local_ovs, ven_acc, ven_type, ven_group }) {
        const client = await db.connect();
        const promise = new Promise(async (resolve, reject) => {
            const q = `SELECT HEADER FROM VEN_CODE_HD WHERE local_ovs='${local_ovs}' and ven_acc='${ven_acc}' and ven_type='${ven_type}' and ven_group='${ven_group}'`;
            try {
                const headercode = await client.query(q);
                resolve({ status: true, header: headercode.rows[0] });
            } catch (err) {
                reject({ status: false, message: "Header not found" });
            } finally {
                client.release();
            }
        });
        return promise;
    },

    async getApprovedVendor() {
        const client = await db.connect();
        try {
            let query = `
            SELECT 
                ven.ven_code,
                ven.name_1,
                ven.email_pic,
                ven.no_telf_pic,
                ven.street,
                ven.city,
                bank.country,
                bank.bank_id,
                bank.bank_curr,
                bank.bank_acc,
                bank.acc_hold,
                user.email,
                file.file_name
            FROM vendor ven
            JOIN ven_bank bank ON ven.ven_id = bank.ven_id
            JOIN ticket tic ON ven.ticket_num = tic.ticket_id
            JOIN mst_user user ON tic.proc_id = user.user_id
            JOIN ven_file_atth file ON ven.ven_id = file.ven_id
            WHERE ven.ven_code IS NOT NULL
            `;

            const result = await client.query(query);
            return {
                count: result.rowCount,
                data: result.rows,
            };
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            client.release();
        }
    },

    async verifyVendor(status, id) {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const result = await client.query(
                `
                UPDATE vendor SET is_verif = $1 WHERE ven_id = $2
                `,
                [status, id]
            );
            await client.query(TRANS.COMMIT);
            console.log(result);
            return result;
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            client.release();
        }
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
