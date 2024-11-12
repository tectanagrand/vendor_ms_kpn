const db = require("../config/connection");
const moment = require("moment");

const TNUMGen = {
    createTnum: async (sequence, thead) => {
        const client = await db.connect();
        try {
            const today = new Date();
            const getNxtVl = await client.query(
                `select nextval('${sequence}')`
            );
            const nextval = getNxtVl.rows[0].nextval;
            const year = today.getFullYear().toString().substr(-2);
            const month = ("0" + (today.getMonth() + 1).toString()).substr(-2);
            const ticketNumber =
                thead + year + month + String(nextval).padStart(4, "0");
            return ticketNumber;
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    },
    GenTicketEditDetReq: (username, lastticketedit) => {
        //format RDUUUUMMYYXXX
        // TOL => identifier
        // UUU => 3 last digit user code
        let running_num = 1;
        const max_num = 999;
        let month = moment().format("MM");
        let year = moment().format("YY");
        let U = username.slice(-4);

        if (lastticketedit) {
            let curmth = lastticketedit.slice(7, 9);
            let curyr = lastticketedit.slice(9, 11);
            if (year === curyr) {
                if (month === curmth) {
                    running_num = parseInt(lastticketedit.slice(-3)) + 1;
                    if (running_num > max_num) {
                        running_num = 1;
                    }
                }
            }
        }
        return (
            "RD" + U + month + year + running_num.toString().padStart(3, "0")
        );
    },
};

module.exports = TNUMGen;
