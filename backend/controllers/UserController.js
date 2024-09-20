const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const db = require("../config/connection");
const TRANS = require("../config/transaction");
const crud = require("../helper/crudquery");
const { hashPassword } = require("../middleware/hashpass");
const PageModel = require("../models/PageModel");

const UserController = {
    showAll: async (req, res) => {
        try {
            let data = await User.showAll();
            res.status(200).send(data);
        } catch (err) {
            console.error(err);
            res.status(500).send({
                message: "Server Error",
            });
        }
    },
    loginUser: async (req, res) => {
        try {
            const logData = await User.loginUser({
                username: req.body.username,
                password: req.body.password,
            });
            const { jsonMenu, nameMenu } = await PageModel.showAll(
                logData.groupid
            );

            // res.cookie("jwt", logData.refreshToken, {
            //     httpOnly: true,
            //     secure: false,
            //     sameSite: false,
            //     maxAge: 7 * 24 * 60 * 60 * 1000,
            // });
            // console.log(logData);
            res.status(200).send({
                ...logData,
                menu: jsonMenu,
            });
        } catch (err) {
            console.log(err);
            res.status(500).send({
                message: err,
            });
        }
    },

    getAuthorization: async (req, res) => {
        try {
            const group_id = req.body.group_id;
            const dataAuth = await User.getAuthorization(group_id);
            res.status(200).send(dataAuth);
        } catch (error) {
            console.error(error);
            res.status(500).send(error);
        }
    },

    refreshToken: async (req, res) => {
        try {
            const client = await db.connect();
            const cookies = req.cookies;
            if (!cookies?.accessToken) {
                return res.status(401).send({
                    message: "Unauthorized",
                });
            }
            try {
                let refToken_q = "";
                if (cookies.role !== "MGR") {
                    refToken_q = `select token from mst_user where user_id = '${cookies.user_id}'`;
                } else if (cookies.role === "VENDOR") {
                    refToken_q = `select token from a_uservendor where user_id = '${cookies.user_id}'`;
                } else {
                    refToken_q = `select token from mst_mgr where mgr_id = '${cookies.user_id}'`;
                }
                const getrefToken = await client.query(refToken_q);
                const refToken = getrefToken.rows[0].token;
                const verif = jwt.verify(refToken, process.env.TOKEN_KEY);
                const newAct = jwt.sign(
                    {
                        id: cookies.user_id,
                        username: cookies.username,
                        email: cookies.email,
                    },
                    process.env.TOKEN_KEY,
                    {
                        expiresIn: "30s",
                    }
                );
                res.status(200).send({
                    accessToken: newAct,
                });
            } catch (error) {
                res.status(401).send({
                    message: "Login Expired",
                });
            } finally {
                client.release();
            }
        } catch (error) {
            console.error(error);
            res.status(401).send({
                message: "Login Expired",
            });
        }
    },

    check: (req, res) => {
        res.status(200).send({
            data: "no",
        });
    },

    showExistSecGrp: async (req, res) => {
        try {
            const existGrp = await User.showExistSecGrp();
            res.status(200).send(existGrp);
        } catch (error) {
            console.error(error);
            res.status(500).send(error);
        }
    },

    showSecurityGroup: async (req, res) => {
        const groupid = req.body.groupid;
        try {
            const pages = await User.showSecurityGroup(groupid);
            res.status(200).send(pages);
        } catch (error) {
            res.status(500).send({
                message: error.stack,
            });
        }
    },

    submitSecurityGroup: async (req, res) => {
        const groupname = req.body.groupname;
        const groupid = req.body.groupid;
        const accessmtx = req.body.accessmtx;
        try {
            const submit = await User.submitSecurityGroup(
                groupname,
                groupid,
                accessmtx
            );
            const submitted = submit.name;
            res.status(200).send({
                message: `${submitted} group has submitted`,
            });
        } catch (error) {
            console.error(error.stack);
            res.status(500).send({
                message: error.stack,
            });
        }
    },

    showRole: async (req, res) => {
        try {
            const roles = await User.showRole();
            res.status(200).send(roles);
        } catch (error) {
            res.status(500).send({
                message: error,
            });
        }
    },

    showManagers: async (req, res) => {
        try {
            const managers = await User.showManagers();
            res.status(200).send(managers);
        } catch (error) {
            res.status(500).send({
                message: error,
            });
        }
    },

    createNewUser: async (req, res) => {
        const Dt = {
            user_id: req.body.user_id,
            username: req.body.username,
            fullname: req.body.fullname,
            email: req.body.email,
            mgr_id: req.body.mgr_id,
            createddate: req.body.createddate,
            expireddate: req.body.expireddate,
            role: req.body.role,
            usergroup: req.body.usergroup,
        };
        if (req.body.hasOwnProperty("password")) {
            Dt.password = req.body.password;
        }
        try {
            let submitDt;
            if (Dt.mgr_id === "") {
                submitDt = await User.createManager(Dt);
            } else {
                submitDt = await User.createUser(Dt);
            }
            console.log(submitDt);
            res.status(200).send({
                message: `success created ${submitDt.name}`,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send(error);
        }
    },

    showUserData: async (req, res) => {
        const idUser = req.query.iduser;
        try {
            const userId = await User.showUserData(idUser);
            res.status(200).send(userId);
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: "failed to fetch data",
            });
        }
    },

    otpresetPassword: async (req, res) => {
        const client = await db.connect();
        try {
            const user_id = req.cookies.user_id;
            const vendor = req.body.is_vendor ?? false;
            const resetPwd = req.body.newpwd;
            if (resetPwd === undefined || resetPwd === "") {
                throw new Error("Please provide new password");
            }
            if (user_id === "" || user_id === undefined) {
                throw new Error("User is missing");
            }
            let pass = "";

            await client.query(TRANS.BEGIN);
            const checkExist = await client.query(
                `select inserted from otp_transaction where user_id = '${user_id}'`
            );
            if (checkExist.rowCount === 0) {
                throw new Error("OTP not requested");
            }
            const isOtpValidated = checkExist.rows[0]?.inserted;
            if (isOtpValidated) {
                pass = await hashPassword(resetPwd);
            } else {
                throw new Error("OTP not validated");
            }
            const items = {
                password: pass,
            };
            let [que, val] = ["", ""];
            if (vendor) {
                [que, val] = crud.updateItem(
                    "a_uservendor",
                    { ...items, is_reset_pwd: true },
                    { user_id: user_id },
                    "username"
                );
            } else {
                [que, val] = crud.updateItem(
                    "mst_user",
                    items,
                    { user_id: user_id },
                    "username"
                );
            }
            const resetPass = await client.query(que, val);
            const otpdelete = await client.query(
                `delete from otp_transaction where user_id = '${user_id}'`
            );
            await client.query(TRANS.COMMIT);
            res.status(200).send({
                message: `${resetPass.rows[0].username} password have been reseted`,
            });
        } catch (error) {
            console.log(error);
            res.status(500).send({
                message: error.message,
            });
        } finally {
            client.release();
        }
    },

    updateStatUser: async (req, res) => {
        const id = req.body.id;
        const role = req.body.role;
        const is_active = req.body.is_active;
        const client = await db.connect();
        let query, val;
        try {
            await client.query(TRANS.BEGIN);
            if (role === "MGR") {
                [query, val] = crud.updateItem(
                    "mst_mgr",
                    { is_active: is_active },
                    { mgr_id: id },
                    "username"
                );
            } else {
                [query, val] = crud.updateItem(
                    "mst_user",
                    { is_active: is_active },
                    { user_id: id },
                    "username"
                );
            }
            const setStat = await client.query(query, val);
            await client.query(TRANS.COMMIT);
            res.status(200).send({
                message: `${setStat.rows[0].username} is updated`,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        } finally {
            client.release();
        }
    },
};

module.exports = UserController;
