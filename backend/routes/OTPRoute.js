const express = require("express");
const router = express.Router();
const controller = require("../controllers/OTPController");

router.post("/sendotp", controller.sendOTP);
router.post("/validateotp", controller.validateOTP);

module.exports = router;
