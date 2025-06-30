const db = require("../config/connection");

const DBClientWrapper = async callback => {
    try {
        const client = await db.connect();
        return callback(client);
    } catch (error) {
        throw error;
    } finally {
        client.release();
    }
};

module.exports = DBClientWrapper;
