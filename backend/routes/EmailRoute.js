const express = require("express");
const router = express.Router();
const controller = require("../controllers/EmailController");

router.post("/sendmgr", controller.sendToManager);
router.post("/request", controller.sendToRequest);
router.post("/approve", controller.sendToApprove);
router.post("/reject", controller.sendToReject);
router.post("/tomdm", controller.sendToMDM);

module.exports = router;
