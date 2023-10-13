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
        let token = req.headers.authorization.split(" ")[1];
        let decode;
        if (
            req.headers.authorization === undefined ||
            req.headers.authorization === null
        ) {
            res.status(401).send({
                message: "Access Denied",
            });
        } else {
            try {
                if (token !== undefined) {
                    decode = jwt.verify(token, process.env.TOKEN_KEY);
                } else {
                    const exception = new Error();
                    exception.name = "Unauthorized";
                    exception.response = {
                        status: 401,
                        data: {
                            message: "Unauthorized",
                        },
                    };
                    throw exception;
                }
                req.useridSess = decode.id;
                next();
            } catch (err) {
                if (err.response.status === 401) {
                    res.status(401).send({
                        message: err.response.data.message,
                    });
                } else {
                    res.status(500).send({
                        message: err.stack,
                    });
                }
            }
        }
    },
};

module.exports = TokenManager;
