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
            username: req.body.username,
            fullname: req.body.fullname,
            email: req.body.email,
            mgr_id: req.body.mgr_id,
            password: req.body.password,
            createddate: req.body.createddate,
            expireddate: req.body.expireddate,
            role: req.body.role,
            usergroup: req.body.usergroup,
        };
        try {
            let submitDt;
            if (Dt.mgr_id === "") {
                submitDt = await User.createManager(Dt);
            } else {
                submitDt = await User.createUser(Dt);
            }
            res.status(200).send({
                message: `success created user ${submitDt.name}`,
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
};

module.exports = UserController;
