const pool = require("../config/db");
const uuid = require("uuidv4");

class User {
    constructor(email, name, role, expiredat) {
        this.email = email;
        this.name = name;
        this.role = role;
        this.expiredat = expiredat;
    }

    static showAll = async function () {
        const client = pool.connect();

        try {
            await client.query("BEGIN");
            const res = (await client).query("SELECT * FROM MST_USER");
            return res;
        } catch (err) {
            return err;
        } finally {
            (await client).release;
        }
    };
}

module.exports = User;
