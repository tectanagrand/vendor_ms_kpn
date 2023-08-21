const express = require("express");
const User = require("./UserRoute");
const router = express.Router();

router.use("/api/user", User);

module.exports = router;
