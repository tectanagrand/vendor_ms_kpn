const User = require("../models/UserModel");
UserController = {};

UserController.showAll = async (req, res) => {
    let row = await User.showAll();
    let count = { count: row.rowCount, data: row.rows };
    res.send(count);
};

UserController.createUser = async (req, res) => {
    try {
        await User.createUser(req.body);
        res.send({
            status: 200,
            message: "new user successfully created",
        });
    } catch (err) {
        res.send({
            status: 400,
            message: err.stack,
        });
    }
};

module.exports = UserController;
