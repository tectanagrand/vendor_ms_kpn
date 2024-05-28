const jwt = require("jsonwebtoken");
const db = require("../config/connection");

const VerifyLogin = {};

VerifyLogin.verif = async (req, res, next) => {
    const cookies = req.cookies;
    if (!cookies.accessToken) {
        res.status(401).send({
            message: "Unauthorized",
        });
    }
    try {
        const verifJWT = jwt.verify(cookies.accessToken, process.env.TOKEN_KEY);
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            try {
                const client = await db.connect();
                try {
                    const { rows } = await client.query(
                        `select token from (select username, user_id, token from mst_user mu 
            union 
            select username, mgr_id as user_id, token from mst_mgr mm ) u where user_id = $1`,
                        [cookies.user_id]
                    );
                    const refreshToken = rows[0].token;
                    jwt.verify(refreshToken, process.env.TOKEN_KEY);
                    next();
                } catch (error) {
                    throw error;
                } finally {
                    client.release();
                }
            } catch (error) {
                res.status(401).send({
                    message: "Unauthorized",
                });
            }
        }
    }
};

module.exports = VerifyLogin;
