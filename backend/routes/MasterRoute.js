const express = require("express");
const router = express.Router();
const controller = require("../controllers/MasterController");

router.post("/country", controller.getCountry);
router.post("/city", controller.getCity);
router.get("/curr", controller.getCurrency);
router.get("/bank", controller.getBank);

module.exports = router;
