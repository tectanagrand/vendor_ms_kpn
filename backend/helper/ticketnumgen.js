const db = require("../config/connection");

const TNUMGen = {
    createTnum: async (sequence, thead) => {
        const today = new Date();
        const getNxtVl = await db.query(`select nextval('${sequence}')`);
        const nextval = getNxtVl.rows[0].nextval;
        const year = today.getFullYear().toString().substr(-2);
        const month = ("0" + (today.getMonth() + 1).toString()).substr(-2);
        const ticketNumber =
            thead + year + month + String(nextval).padStart(4, "0");
        return ticketNumber;
    },
};

module.exports = TNUMGen;
