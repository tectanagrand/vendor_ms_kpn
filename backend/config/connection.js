const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    ssl: {
        rejectUnauthorized: false,
    },
    idleTimeoutMillis: 3000,
    connectionTimeoutMillis: 30000,
    allowExitOnIdle: true,
    // ssl: false,
});

module.exports = pool;
