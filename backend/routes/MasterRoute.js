const express = require("express");
const router = express.Router();
const controller = require("../controllers/MasterController");

router.post("/country", controller.getCountry);
router.post("/city", controller.getCity);

module.exports = router;
