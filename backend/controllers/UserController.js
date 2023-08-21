const People = require("../models/UserModel");

class UserController {
    static showAll = (req, res) => {
        let items = People.showAll();
        items
            .then(result => {
                console.log(result);
                res.send(result);
            })
            .catch(error => {
                console.log(error);
            });
    };
}

module.exports = new UserController();
