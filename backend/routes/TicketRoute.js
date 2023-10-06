const express = require("express");
const router = express.Router();
const controller = require("../controllers/TicketController");
const AuthToken = require("../middleware/tokenmanager");

router.post("/new", controller.openNew);
router.get("/form/new/:tnum", controller.headerTicket);
router.get("/form/:id", controller.getTicketById); // get ticket by id ;
router.post("/form/submit", controller.submitTicket);
router.post("/form/v1/submit", controller.singleSubmit);
router.get("/", controller.showAll);
router.patch("/reject", controller.rejectTicket);

module.exports = router;
