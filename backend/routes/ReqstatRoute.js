const express = require("express");
const Reqstat = require("../controllers/ReqstatController");
const AuthToken = require("../middleware/tokenmanager");

const router = express.Router();

router.post("/new", Reqstat.request);
router.post("/process", AuthToken.authSession, Reqstat.processReq);
router.get("/show", Reqstat.showAll);

module.exports = router;
