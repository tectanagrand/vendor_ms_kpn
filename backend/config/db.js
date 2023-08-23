const pool = require("./connection");
db = {};
db.query = (text, params) => {
    pool.connect();
    return pool.query(text, params);
};

module.exports = db;
