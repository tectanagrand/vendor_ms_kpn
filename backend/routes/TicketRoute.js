const express = require("express");
const router = express.Router();
const controller = require("../controllers/TicketController");
const AuthToken = require("../middleware/tokenmanager");

router.post("/new", AuthToken.authSession, controller.openNew);
router.get("/form/new/:tnum", controller.headerTicket);
router.get("/form/:id", AuthToken.authSession, controller.getTicketById);
router.get("/newform/:id", controller.getTicketById); // get ticket by id ;
router.post("/form/submit", AuthToken.authSession, controller.submitVendor);
router.post("/newform/submit", controller.submitVendor);
router.post("/form/v1/submit", controller.singleSubmit);
router.get("/", AuthToken.authSession, controller.showAll);
router.patch("/reject", AuthToken.authSession, controller.rejectTicket);
router.delete("/:ticket_id", controller.deleteTicket);
router.get("/mgrappr", controller.processMgr);
router.get("/mgrapprprc", controller.processMgrPrc);
// router.get("/mgrapprdws",)
router.get("/mgrtest", controller.testmgr);
router.post("/rejectmgr", controller.rejectformmgr);
router.post("/rejectmgrprc", controller.rejectformgrproc);
router.get("/rejectlog", controller.rejectLog);
router.post("/checkvalid", controller.checkValidTicket);
router.post("/extexp", AuthToken.authSession, controller.extendOneDay);
router.post("/resendceo", AuthToken.authSession, controller.resendCEO);

module.exports = router;
