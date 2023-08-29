const User = require("../models/UserModel");
UserController = {};

UserController.showAll = async (req, res) => {
    try {
        let row = await User.showAll();
        let count = { status: 200, count: row.rowCount, data: row.rows };
        res.status(200).send(count);
    } catch (err) {
        res.status(500).send({
            message: "Server Error",
        });
    }
};

UserController.createUser = async (req, res) => {
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
};

module.exports = UserController;
