const express = require("express");
const route = express.Router();
const controller = require("../controllers/VendorController");
const Auth = require("../middleware/tokenmanager");

route.get("/", controller.showAll);
route.post("/add/:id", controller.setVenDetail);
route.post("/uploadtemp", controller.setTempFile);
route.get("/file/:id", controller.getFile);
route.get("/bank/:id", controller.getBank);
route.delete("/file", controller.deleteTempId);
route.get("/checkven", controller.checkNameisExist);
route.get("/infoven/", Auth.authSession, controller.getInfoVen);

module.exports = route;
