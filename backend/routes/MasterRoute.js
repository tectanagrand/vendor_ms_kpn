const express = require("express");
const router = express.Router();
const controller = require("../controllers/MasterController");
const Auth = require("../middleware/tokenmanager");

router.post("/country", controller.getCountry);
router.post("/city", controller.getCity);
router.get("/curr", controller.getCurrency);
router.get("/bank", controller.getBank);
router.get("/company", controller.getCompany);
router.get("/file/:filename", Auth.authSession, controller.downloadFile);

module.exports = router;
