const express = require("express");
const router = express.Router();
const controller = require("../controllers/TicketController");

router.post("/new", controller.openNew);
router.get("/form/new/:tnum", controller.headerTicket);
router.get("/form/:id", controller.getTicketById); // get ticket by id ;
router.get("/", controller.showAll);

module.exports = router;
