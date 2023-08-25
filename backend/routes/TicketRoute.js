const express = require("express");
const router = express.Router();
const controller = require("../controllers/TicketController");

router.post("/new", controller.openNew);
router.get("/", controller.showAll);

module.exports = router;
