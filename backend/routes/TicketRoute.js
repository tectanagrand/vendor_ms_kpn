const express = require("express");
const router = express.Router();
const controller = require("../controllers/TicketController");

router.post("/new", controller.openNew);

module.exports = router;
