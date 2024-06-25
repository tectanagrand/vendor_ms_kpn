const db = require("../config/connection");
const qr = require("qrcode");
const fa = require("speakeasy");
const TRANS = require("../config/transaction");
const crud = require("../helper/crudquery");

const Master = {
    async getCurrency() {
        const client = await db.connect();
        try {
            const countries = await client.query(
                "SELECT distinct code, nation  FROM mst_currency"
            );
            return {
                count: countries.rowCount,
                data: countries.rows,
            };
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            client.release();
        }
    },
    async getCountry() {
        const client = await db.connect();
        try {
            const countries = await client.query(
                "SELECT * FROM mst_country order by country_name"
            );
            return {
                count: countries.rowCount,
                data: countries.rows,
            };
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            client.release();
        }
    },

    async getCities(idCountry) {
        const client = await db.connect();
        try {
            const where = `country_id = '${idCountry}'`;
            let q = "SELECT DISTINCT city, code, country_id FROM mst_cities";
            q = q + " where " + where;
            q += " order by city asc";
            const cities = await client.query(q);
            return {
                count: cities.rowCount,
                data: cities.rows,
            };
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            client.release();
        }
    },

    async getBank(ven_id) {
        const client = await db.connect();
        try {
            const items = await client.query(
                `SELECT * FROM MST_BANK ORDER BY BANK_NAME`
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

    async getCompany() {
        const client = await db.connect();
        try {
            const items = await client.query(
                `SELECT * FROM MST_COMPANY ORDER BY code`
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

    async genQrAuth() {
        var secret = fa.generateSecret({
            name: "QR Test",
        });
        var qrcode = await qr.toDataURL(secret.otpauth_url);
        return { qr: qrcode, secret: secret };
    },

    async getssrBank({ page, maxPage, que }) {
        const client = await db.connect();
        let qtext = "";
        if (que != null && que != "") {
            qtext = ` where lower(b.bank_code) like '%${que}%' or lower(b.bank_key) like '%${que}%' or lower(b.bank_name) like '%${que}%'`;
        }
        let q = `select b.*, c.country_name from mst_bank_sap b left join mst_country c on b.country = c.country_code ${qtext} order by b.bank_code asc limit ${maxPage} offset ${
            page * maxPage
        } 
        `;
        try {
            const data = await client.query(q);
            const allRows = await client.query(
                `select count(*) as rowscount from mst_bank_sap b ${qtext}`
            );
            return {
                allrow: allRows.rows[0].rowscount,
                count: data.rowCount,
                data: data.rows,
            };
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    },

    async createNewBank({
        swiftcode,
        bankkey,
        bankname,
        address1,
        address2,
        address3,
        created_by,
        country,
        source,
        type,
        id,
    }) {
        let query, val;
        const client = await db.connect();
        await client.query(TRANS.BEGIN);
        try {
            const insertedval = {
                bank_code: swiftcode,
                bank_key: bankkey,
                bank_name: bankname,
                address_1: address1,
                address_2: address2,
                address_3: address3,
                created_by: created_by,
                country: country,
                source: source,
            };
            if (type === "insert") {
                const checkexist = `select * from mst_bank_sap where bank_code = '${swiftcode}' `;
                const existBank = await client.query(checkexist);
                if (existBank.rowCount > 0) {
                    throw new Error(
                        "Unique (bank_code, bank_key) already exists"
                    );
                }
                [query, val] = crud.insertItem(
                    "mst_bank_sap",
                    insertedval,
                    "id"
                );
            } else {
                [query, val] = crud.updateItem(
                    "mst_bank_sap",
                    { ...insertedval, source: null },
                    { id: id },
                    "id"
                );
            }
            const processQuery = await client.query(query, val);
            await client.query(TRANS.COMMIT);
            return {
                swiftcode: swiftcode,
                bankkey: bankkey,
                name: bankname,
                id: processQuery.rows[0].id,
            };
        } catch (error) {
            console.log(error);
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    },
};

module.exports = Master;
