const db = require("../config/connection");

const Master = {
    async getCurrency() {
        try {
            const client = await db.connect();
            const countries = await client.query("SELECT * FROM mst_currency");
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
            const client = await db.connect();
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
        }
    },

    async getCities(idCountry) {
        try {
            const client = await db.connect();
            const where = `country_id = '${idCountry}'`;
            let q = "SELECT * FROM mst_cities";
            if (idCountry !== null) {
                q = q + " where " + where;
            }
            q += " order by city asc";
            const cities = await client.query(q);
            return {
                count: cities.rowCount,
                data: cities.rows,
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
};

module.exports = Master;
