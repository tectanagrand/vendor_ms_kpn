const express = require("express");
const User = require("./UserRoute");
const Ticket = require("./TicketRoute");
const Vendor = require("./VendorRoute");
const router = express.Router();

router.use("/api/user", User);
router.use("/api/ticket", Ticket);
router.use("/api/vendor", Vendor);

module.exports = router;
