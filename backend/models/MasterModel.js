const db = require("../config/connection");

const Master = {
    async getCountry() {
        try {
            const client = await db.connect();
            const countries = await client.query("SELECT * FROM mst_country");
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
