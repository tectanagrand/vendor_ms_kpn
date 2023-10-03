const jwt = require("jsonwebtoken");
const db = require("../config/connection");
const TokenManager = {
    async authToken(req, res, next) {
        let token;
        if (
            req.headers["x-access-token"] == null ||
            req.headers["x-access-token"] == undefined
        ) {
            token = this.getTicketToken(req.body.ticket_num);
        } else {
            token = req.headers["x-access-token"];
        }
        if (token == null || token == undefined) {
            res.status(400).send({
                status: 400,
                message: "token required",
            });
        }
        try {
            const decode = jwt.verify(token, process.env.REACT_APP_URL_LOC);
            req.tokendecode = decode;
            next();
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: error,
            });
        }
    },

    async getTicketToken(token) {
        const q = `SELECT * FROM TICKET WHERE TOKEN = '${token}'`;
        const ticket = await db.query(q);
        if (ticket.rows[0] == null) {
            res.status(400).send({
                status: 400,
                message: "ticket not found",
            });
        }
        const jwttoken = ticket.rows[0].jwttoken;
        return jwttoken;
    },
};

module.exports = TokenManager;
