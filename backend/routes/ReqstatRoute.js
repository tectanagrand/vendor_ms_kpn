const express = require("express");
const Reqstat = require("../controllers/ReqstatController");
const AuthToken = require("../middleware/tokenmanager");

const router = express.Router();

router.post("/new", Reqstat.request);
router.post("/process", AuthToken.authSession, Reqstat.processReq);
router.get("/show", Reqstat.showAll);
router.get("/mgrappract", Reqstat.approvalMgr);
router.post("/mgrapprrej", Reqstat.rejectMgr);

module.exports = router;
