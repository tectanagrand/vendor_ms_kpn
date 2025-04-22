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
                `SELECT * FROM MST_COMPANY where is_active = true ORDER BY name asc`
            );
            // console.log(items);
            const grouping = new Map();
            for (const i of items.rows) {
                if (!grouping.get(i.group_comp)) {
                    grouping.set(i.group_comp, [
                        { name: i.name, code: i.sap_code, comp_id: i.comp_id },
                    ]);
                } else {
                    grouping.set(i.group_comp, [
                        ...grouping.get(i.group_comp),
                        { name: i.name, code: i.sap_code, comp_id: i.comp_id },
                    ]);
                }
            }
            let result = {
                count: items.rowCount,
                data: Object.fromEntries(grouping.entries()),
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
        bu,
    }) {
        let query, val;
        const client = await db.connect();
        await client.query(TRANS.BEGIN);
        try {
            let insertedval = {
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
            if (bu == "CG") {
                insertedval = {
                    bank_code: swiftcode,
                    bank_name: bankname,
                    create_by: created_by,
                    is_new: true,
                };
            }
            let return_query = "id";
            if (bu == "CG") {
                return_query = "bank_code";
            }
            if (type === "insert") {
                let checkexist = `select * from mst_bank_sap where bank_code = $1 `;
                let target = "mst_bank_sap";
                if (bu == "CG") {
                    checkexist =
                        "select * from cg_mst_bank where bank_code = $1";
                    target = "cg_mst_bank";
                }
                const existBank = await client.query(checkexist, [swiftcode]);
                if (existBank.rowCount > 0) {
                    throw new Error(
                        "Unique (bank_code, bank_key) already exists"
                    );
                }
                [query, val] = crud.insertItem(
                    target,
                    insertedval,
                    return_query
                );
            } else {
                let where_up = { id: id };
                if (bu == "CG") {
                    where_up = { bank_code: swiftcode };
                }
                [query, val] = crud.updateItem(
                    "mst_bank_sap",
                    { ...insertedval, source: null },
                    where_up,
                    return_query
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

    async getVAT() {
        try {
            const client = await db.connect();
            try {
                const { rows: vat_data } = await client.query(`
                    select ppn_code, ppn_desc, ppn_value from mst_ppn                    
                    `);
                return vat_data;
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },
    async getBU() {
        try {
            const client = await db.connect();
            try {
                const { rows: getBU } = await client.query(
                    `select bu_code, bu_name from mst_bu`
                );
                return getBU;
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },
    async getDept() {
        try {
            const client = await db.connect();
            try {
                const { rows: getDept } = await client.query(
                    `select dept_code, dept_name from mst_department`
                );
                return getDept;
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },
    async getEmpRole() {
        try {
            const client = await db.connect();
            try {
                const { rows: getRole } = await client.query(
                    `select role_code, role_name from mst_emp_role`
                );
                return getRole;
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },
    async GetFileType({ title, ventype, bu_id, curpos }) {
        try {
            const client = await db.connect();
            try {
                let where = [];
                let whereval = [];
                let index = 1;

                if (title == "COMPANY") {
                    where.push(`company = $${index}`);
                    whereval.push(true);
                    index++;
                } else if (title == "PERSONAL") {
                    where.push(`personal = $${index}`);
                    whereval.push(true);
                    index++;
                }

                switch (ventype) {
                    case "LOCAL":
                        where.push(`local = $${index}`);
                        whereval.push(true);
                        index++;
                        break;
                    case "OVERSEAS":
                        where.push(`ovs = $${index}`);
                        whereval.push(true);
                        index++;
                        break;
                    case "OVS":
                        where.push(`ovs = $${index}`);
                        whereval.push(true);
                        index++;
                        break;
                    case "GOVERNMENT":
                        where.push(`government = $${index}`);
                        whereval.push(true);
                        index++;
                        break;
                    case "INTERCOMPANY":
                        where.push(`intercompany = $${index}`);
                        whereval.push(true);
                        index++;
                        break;
                    case "PRIVATE":
                        where.push(`private = $${index}`);
                        whereval.push(true);
                        index++;
                        break;
                }

                if (bu_id) {
                    where.push(`bu_id = $${index}`);
                    whereval.push(bu_id);
                    index++;
                } else {
                    throw new Error("Provide bu_id");
                }

                if (curpos == "VENDOR") {
                    where.push(`approval_role = $${index}`);
                    whereval.push(curpos);
                    index++;
                } else {
                    where.push(
                        `(approval_role = $${index} or approval_role = $${
                            index + 1
                        })`
                    );
                    whereval.push("VENDOR");
                    whereval.push("STAFF");
                    index += 2;
                }
                const { rows } = await client.query(
                    `
                    select file_code, file_type, is_mandatory, help, helpen, need_exp_date
                    from mst_file_type where ${where.join(
                        " and "
                    )} order by file_code asc                    
                    `,
                    whereval
                );
                return rows;
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },
    async CGVenClass() {
        try {
            const client = await db.connect();
            try {
                const { rows } = await client.query(
                    `select class_code, class_desc from cg_mst_venclass`
                );
                return rows;
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },
    async CGVenType() {
        try {
            const client = await db.connect();
            try {
                const { rows } = await client.query(
                    `select type_code, type_name from cg_mst_ventype`
                );
                return rows;
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },
    async CGUsedTax() {
        try {
            const client = await db.connect();
            try {
                const { rows } = await client.query(
                    `select used_tax_code, used_tax_desc from cg_mst_used_tax`
                );
                return rows;
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },
    async CGPriceTerm() {
        try {
            const client = await db.connect();
            try {
                const { rows } = await client.query(
                    `select price_term_code, price_term_desc from cg_mst_price_term`
                );
                return rows;
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },
    async CGPayTerm() {
        try {
            const client = await db.connect();
            try {
                const { rows } = await client.query(
                    `select pay_term_code, pay_term_desc from cg_mst_payterm`
                );
                return rows;
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },
    async CGCurrency() {
        try {
            const client = await db.connect();
            try {
                const { rows } = await client.query(
                    `select currency_code, currency_name from cg_mst_currency`
                );
                return rows;
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },
    async CGCountry() {
        try {
            const client = await db.connect();
            try {
                const { rows } = await client.query(
                    `select country_code, country_name, area_code from cg_mst_country`
                );
                return rows;
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },
    async CGArea() {
        try {
            const client = await db.connect();
            try {
                const { rows } = await client.query(
                    `select area_code, area_name from cg_mst_area`
                );
                return rows;
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },
    async CGBank() {
        try {
            const client = await db.connect();
            try {
                const { rows } = await client.query(
                    `select bank_code, bank_name, is_new from cg_mst_bank where is_active = true`
                );
                return rows;
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },

    async GetMasterBadanUsaha() {
        try {
            const client = await db.connect();
            try {
                const { rows } = await client.query(`
                    select id_badan_usaha, badan_usaha from mst_badan_usaha where is_active = true                    
                    `);
                return rows;
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },

    async GetMasterTitle() {
        try {
            const client = await db.connect();
            try {
                const { rows } = await client.query(`
                    select title_code, title_name from mst_title where is_active = true                    
                    `);
                return rows;
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    },
};

module.exports = Master;
