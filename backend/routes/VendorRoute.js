const express = require("express");
const route = express.Router();
const controller = require("../controllers/VendorController");

route.get("/", controller.showAll);
route.post("/add/:id", controller.newbyVendor);
route.post("/uploadtemp", controller.setTempFile);
route.get("/temp/:id", controller.getFile);

module.exports = route;
