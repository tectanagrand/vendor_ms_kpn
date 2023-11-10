const express = require("express");
const Reqstat = require("../controllers/ReqstatController");

const router = express.Router();

router.post("/new", Reqstat.request);
router.post("/process", Reqstat.processReq);
router.get("/show", Reqstat.showAll);

module.exports = router;
