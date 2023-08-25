const db = require("../config/connection.js");
const uuid = require("uuidv4");
const bcrypt = require("bcrypt");
const { hashPassword } = require("../middleware/hashpass.js");

User = {};

User.showAll = () => {
    const row = db.query(`SELECT * FROM mst_mgr`);
    return row;
};

User.createUser = async params => {
    const client = await db.connect();
    let table = "";
    let column = "";
    let value;
    let pass = await hashPassword(params.PASSWORD);
    try {
        const date = new Date().toLocaleDateString();
        const exp_date = date => {
            let currentdate = new Date(date);
            currentdate.setMonth(currentdate.getMonth() + 36);
            let nextMonth = currentdate.toLocaleDateString();
            return nextMonth;
        };
        switch (params.ROLE) {
            case "USER":
                table = "mst_user";
                column = `("user_id", "mgr_id", "fullname", "username", "email", "role", "created_at", "updated_at", "is_active", 
                "expired_date", "password")`;
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
                    pass,
                ];
                parse = "($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)";
                break;
            case "MANAGER":
                table = "MST_MGR";
                column = `("MGR_ID", "FULLNAME", "USERNAME", "EMAIL", "PASSWORD", "ROLE", "CREATED_AT", "UPDATED_AT", "EXPIRED_DATE", "IS_ACTIVE")`;
                value = [
                    uuid.uuid(),
                    params.FULLNAME,
                    params.USERNAME,
                    params.EMAIL,
                    pass,
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
        let result = await client.query(query, value);
        // console.log("res");
        // console.log(items);
        await client.query("COMMIT");
        return result;
    } catch (err) {
        console.log(err);
        await client.query("ROLLBACK");
        throw err;
        // console.log("err");
    }
};

module.exports = User;
