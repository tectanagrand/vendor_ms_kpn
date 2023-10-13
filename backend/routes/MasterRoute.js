const express = require("express");
const router = express.Router();
const controller = require("../controllers/MasterController");

router.post("/country", controller.getCountry);
router.post("/city", controller.getCity);
router.get("/curr", controller.getCurrency);
router.get("/bank", controller.getBank);
router.get("/company", controller.getCompany);

module.exports = router;
