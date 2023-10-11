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
            res.status(401).send({
                message: error.stack,
            });
        }
    },

    authSession: async (req, res, next) => {
        console.log(req.headers);
        if (
            req.headers.authorization === undefined ||
            req.headers.authorization === null
        ) {
            res.status(401).send({
                message: "Access Denied",
            });
        } else {
            try {
                let token = req.headers.authorization.split(" ")[1];
                const decode = jwt.verify(token, process.env.TOKEN_KEY);
                req.useridSess = decode.id;
                next();
            } catch (err) {
                res.status(500).send({
                    message: err.stack,
                });
            }
        }
    },
};

module.exports = TokenManager;
