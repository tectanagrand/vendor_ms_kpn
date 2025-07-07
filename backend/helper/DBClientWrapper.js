const db = require("../config/connection");

const DBClientWrapper = async callback => {
    let client;
    try {
        client = await db.connect();
        return await callback(client);
    } catch (error) {
        throw error;
    } finally {
        if (client) client.release();
    }
};

module.exports = DBClientWrapper;
