const express = require("express");
const router = express.Router();
const controller = require("../controllers/MasterController");
const Auth = require("../middleware/tokenmanager");

router.post("/country", controller.getCountry);
router.post("/city", controller.getCity);
router.get("/curr", controller.getCurrency);
router.get("/bank", controller.getBank);
router.get("/banksap", controller.getBankSAP);
router.get("/company", controller.getCompany);
router.get("/file/:filename", controller.downloadFile);
router.get("/genqr", controller.genQrcode);
router.get("/payterm", controller.getPayterm);
router.post("/ssrbank", controller.getBankSSR);
router.post("/addbank", controller.insertBank);
router.post("/deletebank", controller.deleteBank);

module.exports = router;
