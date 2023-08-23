const User = require("../models/UserModel");
UserController = {};

UserController.showAll = async (req, res) => {
    let row = await User.showAll();
    let count = { count: row.rowCount, data: row.rows };
    res.send(count);
};

UserController.createUser = async (req, res) => {
    await User.createUser(req.body, (err, add) => {
        console.log(add);
        if (add != false) {
            res.send({
                status: 200,
                message: "new user successfully created",
            });
        } else {
            console.log(err);
            res.send({
                status: 400,
                message: "error",
            });
        }
    });
};
// UserController.createUser = async (req, res) => {};

module.exports = UserController;
