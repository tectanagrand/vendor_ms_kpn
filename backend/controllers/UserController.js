const User = require("../models/UserModel");
const UserController = {
    showAll: async (req, res) => {
        try {
            let row = await User.showAll();
            let count = { status: 200, count: row.rowCount, data: row.rows };
            res.status(200).send(count);
        } catch (err) {
            res.status(500).send({
                message: "Server Error",
            });
        }
    },
    createUser: async (req, res) => {
        try {
            await User.createUser(req.body);
            res.status(200).send({
                status: 200,
                message: "new user successfully created",
            });
        } catch (err) {
            if (err.code == "23505") {
                res.status(400).send({
                    status: 400,
                    message: `${err.constraint} already taken`,
                });
            } else {
                res.status(400).send({
                    status: 500,
                    message: `error occured`,
                });
            }
        }
    },
    loginUser: async (req, res) => {
        try {
            const logData = await User.loginUser({
                username: req.body.username,
                password: req.body.password,
            });
            res.status(200).send({
                ...logData,
            });
        } catch (err) {
            res.status(500).send({
                message: err,
            });
        }
    },
    check: (req, res) => {
        res.status(200).send({
            data: "no",
        });
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
};

module.exports = UserController;
