const ora = require("oracledb");

/**
 * @param {ora.Pool} pool
 *
 */

let pool;

async function initPool() {
    if (!pool) {
        pool = await ora.createPool({
            user: process.env.ORAUSER,
            password: process.env.ORAPWD,
            connectionString: process.env.ORAHOST,
        });
    }
    return pool;
}

/**
 * @returns {Promise<ora.Connection>} - Returns an OracleDB Connection
 */
async function getConnection() {
    if (!pool) {
        await initPool();
    }
    return pool.getConnection();
}

module.exports = { initPool, getConnection, ora };
