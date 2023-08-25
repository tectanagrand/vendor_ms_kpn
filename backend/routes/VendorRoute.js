const express = require("express");
const route = express.Router();
const controller = require("../controllers/VendorController");

route.get("/", controller.showAll);

module.exports = route;
