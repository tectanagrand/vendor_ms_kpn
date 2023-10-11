const express = require("express");
const router = express.Router();
const controller = require("../controllers/TicketController");
const AuthToken = require("../middleware/tokenmanager");

router.post("/new", AuthToken.authSession, controller.openNew);
router.get("/form/new/:tnum", controller.headerTicket);
router.get("/form/:id", AuthToken.authSession, controller.getTicketById); // get ticket by id ;
router.post("/form/submit", AuthToken.authSession, controller.submitTicket);
router.post("/form/v1/submit", controller.singleSubmit);
router.get("/", AuthToken.authSession, controller.showAll);
router.patch("/reject", AuthToken.authSession, controller.rejectTicket);

module.exports = router;
