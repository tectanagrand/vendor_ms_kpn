const db = require("../config/connection.js");
const uuid = require("uuidv4");
const bcrypt = require("bcrypt");

User = {};

User.showAll = () => {
    const row = db.query(`SELECT * FROM "MST_MGR"`);
    return row;
};

User.createUser = async (params, callback) => {
    const client = await db.connect();
    let table = "";
    let column = "";
    let value;
    let parse;
    // console.log(client);
    await client.query("BEGIN");
    try {
        bcrypt.hash(params.PASSWORD, 10, async (err, hash) => {
            if (err) {
                throw err;
            }
            const date = new Date().toLocaleDateString();
            const exp_date = date => {
                let currentdate = new Date(date);
                currentdate.setMonth(currentdate.getMonth() + 36);
                let nextMonth = currentdate.toLocaleDateString();
                return nextMonth;
            };
            switch (params.ROLE) {
                case "USER":
                    table = "MST_USER";
                    column = `("USER_ID", "MGR_ID", "FULLNAME", "USERNAME", "EMAIL", "ROLE", "CREATED_AT", "UPDATED_AT", "IS_ACTIVE", "EXPIRED_DATE", "PASSWORD")`;
                    value = [
                        uuid.uuid(),
                        params.MGR_ID,
                        params.FULLNAME,
                        params.USERNAME,
                        params.EMAIL,
                        params.ROLE,
                        date,
                        date,
                        1,
                        exp_date(date),
                        hash,
                    ];
                    parse = "($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)";
                    break;
                case "MANAGER":
                    table = "MST_MGR";
                    column = `("MGR_ID", "FULLNAME", "USERNAME", "EMAIL", "PASSWORD", "ROLE", "CREATED_AT", "UPDATED_AT", "EXPIRED_DATE", "IS_ACTIVE")`;
                    value = [
                        uuid.uuid(),
                        params.FULLNAME,
                        params.USERNAME,
                        params.EMAIL,
                        hash,
                        params.ROLE,
                        date,
                        date,
                        exp_date(date),
                        1,
                    ];

                    parse = "($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)";
                    break;
            }
            const query = `INSERT INTO "${table}"${column} VALUES ${parse}`;
            let items = client.query(query, value, err => {
                throw err;
            });
            db.on("error", async err => {
                await client.query("ROLLBACK");
                throw err;
            });
            await client.query("COMMIT");
            callback(_, items);
        });
    } catch (e) {
        // console.log(e.stack);
        callback(e.stack, false);
    }
};

module.exports = User;
