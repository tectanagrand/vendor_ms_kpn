const express = require("express");
const User = require("./UserRoute");
const Ticket = require("./TicketRoute");
const router = express.Router();

router.use("/api/user", User);
router.use("/api/ticket", Ticket);

module.exports = router;
