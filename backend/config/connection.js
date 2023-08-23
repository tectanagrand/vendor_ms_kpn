const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORS,
    database: process.env.PGDATABASE,
});

module.exports = pool;
