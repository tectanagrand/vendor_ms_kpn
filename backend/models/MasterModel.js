const db = require("../config/connection");

const Master = {
    async getCurrency() {
        try {
            const countries = await db.query(
                "SELECT distinct code FROM mst_currency"
            );
            return {
                count: countries.rowCount,
                data: countries.rows,
            };
        } catch (err) {
            console.error(err);
            throw err;
        }
    },
    async getCountry() {
        try {
            const countries = await db.query(
                "SELECT * FROM mst_country order by country_name"
            );
            return {
                count: countries.rowCount,
                data: countries.rows,
            };
        } catch (err) {
            console.error(err);
            throw err;
        }
    },

    async getCities(idCountry) {
        try {
            const where = `country_id = '${idCountry}'`;
            let q = "SELECT * FROM mst_cities";
            q = q + " where " + where;
            q += " order by city asc";
            const cities = await db.query(q);
            return {
                count: cities.rowCount,
                data: cities.rows,
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    async getBank(ven_id) {
        try {
            const items = await db.query(
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
        }
    },

    async getCompany() {
        try {
            const items = await db.query(
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
        }
    },
};

module.exports = Master;
