const express = require("express");
const route = express.Router();
const controller = require("../controllers/VendorController");

route.get("/", controller.showAll);
route.post("/add/:id", controller.newbyVendor);
route.get("/uploadtemp", controller.setTempFile);

module.exports = route;
