const express = require("express");
const User = require("./UserRoute");
const Ticket = require("./TicketRoute");
const Vendor = require("./VendorRoute");
const Master = require("./MasterRoute");
const Email = require("./EmailRoute");
const Reqstat = require("./ReqstatRoute");
const Otp = require("./OTPRoute");
const Approval = require("./ApprovalRoute");
const Ticeddet = require("./TicketEditReqDetRoute");
const CGApi = require("./CGApiRoute");
const Material = require("./MaterialRoute");
const router = express.Router();

router.use("/api/user", User);
router.use("/api/ticket", Ticket);
router.use("/api/vendor", Vendor);
router.use("/api/master", Master);
router.use("/api/email", Email);
router.use("/api/reqstat", Reqstat);
router.use("/api/otp", Otp);
router.use("/api/approval", Approval);
router.use("/api/ticeddet", Ticeddet);
router.use("/api/cg", CGApi);
router.use("/api/material", Material);

module.exports = router;
