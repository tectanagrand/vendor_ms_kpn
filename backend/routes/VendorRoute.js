const express = require("express");
const route = express.Router();
const controller = require("../controllers/VendorController");

route.get("/", controller.showAll);
route.post("/add/:id", controller.setVenDetail);
route.post("/uploadtemp", controller.setTempFile);
route.get("/file/:id", controller.getFile);
route.get("/bank/:id", controller.getBank);
route.delete("/file", controller.deleteTempId);

module.exports = route;
