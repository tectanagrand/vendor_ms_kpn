const express = require("express");
const User = require("./UserRoute");
const Ticket = require("./TicketRoute");
const Vendor = require("./VendorRoute");
const Master = require("./MasterRoute");
const Email = require("./EmailRoute");
const Reqstat = require("./ReqstatRoute");
const Otp = require("./OTPRoute");
const router = express.Router();

router.use("/api/user", User);
router.use("/api/ticket", Ticket);
router.use("/api/vendor", Vendor);
router.use("/api/master", Master);
router.use("/api/email", Email);
router.use("/api/reqstat", Reqstat);
router.use("/api/otp", Otp);

module.exports = router;
