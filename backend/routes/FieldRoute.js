const express = require("express");
const router = express.Router();
const FieldController = require("../controllers/FieldController");

router.get("/", FieldController.GetFieldsMaster);

module.exports = router;
