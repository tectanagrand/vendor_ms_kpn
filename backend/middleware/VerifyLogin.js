const jwt = require("jsonwebtoken");
const db = require("../config/connection");

const VerifyLogin = {};

VerifyLogin.verif = async (req, res, next) => {
    const cookies = req.cookies;
    try {
        try {
            const client = await db.connect();
            console.log(req.path);
            try {
                const { rows } = await client.query(
                    `select file_name from whitelist_file`
                );
                const whitelistedFile = rows.map(item => `/${item.file_name}`);
                if (whitelistedFile.includes(req.path)) {
                    return next();
                }
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
        if (!cookies.accessToken) {
            res.status(401).send({
                message: "Unauthorized",
            });
            return;
        }
        const verifJWT = jwt.verify(cookies.accessToken, process.env.TOKEN_KEY);
        return next();
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
                    return next();
                } catch (error) {
                    throw error;
                } finally {
                    client.release();
                }
            } catch (error) {
                console.error(error);
                res.status(401).send({
                    message: "Unauthorized",
                });
            }
        }
    }
};

module.exports = VerifyLogin;
