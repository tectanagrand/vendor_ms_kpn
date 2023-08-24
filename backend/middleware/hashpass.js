const bcrypt = require("bcrypt");

async function hashPassword(user) {
    const password = user;
    const saltRounds = 10;

    const hashedPassword = await new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds, function (err, hash) {
            if (err) reject(err);
            resolve(hash);
        });
    });

    return hashedPassword;
}

module.exports = { hashPassword };
