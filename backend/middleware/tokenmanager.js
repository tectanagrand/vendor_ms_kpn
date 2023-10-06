const jwt = require("jsonwebtoken");
const db = require("../config/connection");

const getTicketToken = async token => {
    try {
        const q = `SELECT * FROM TICKET WHERE TOKEN = '${token}'`;
        const ticket = await db.query(q);
        if (ticket.rows[0] == null) {
            throw new Error("ticket not found");
        }
        const jwttoken = ticket.rows[0].jwttoken;
        return jwttoken;
    } catch (err) {
        throw err;
    }
};

const TokenManager = {
    authToken: async (req, res, next) => {
        try {
            let token;
            if (req.headers.hasOwnProperty("authorization") === false) {
                token = await getTicketToken(req.params.tnum);
            } else {
                token = req.headers.authorization.split(" ")[1];
            }
            if (token == null || token == undefined) {
                res.status(401).send({
                    status: 401,
                    message: "token required",
                });
            }
            const decode = jwt.verify(token, process.env.TOKEN_KEY);
            req.tokendecode = decode;
            next();
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: error.stack,
            });
        }
    },
};

module.exports = TokenManager;
