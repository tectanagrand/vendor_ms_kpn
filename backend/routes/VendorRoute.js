const express = require("express");
const route = express.Router();
const controller = require("../controllers/VendorController");

route.get("/", controller.showAll);
route.post("/add/:id", controller.setVenDetail);
route.post("/uploadtemp", controller.setTempFile);
route.post("/uploadbankfile", controller.setBankFile);
route.get("/file/:id", controller.getFile);
route.get("/bank/:id", controller.getBank);
route.delete("/file", controller.deleteTempId);
route.delete("/delfile", controller.deleteSavedId);
route.get("/checkven", controller.checkNameisExist);
route.post("/deletebank", controller.deleteVenBank);
route.post("/newbank", controller.newBank);
route.post("/verif", controller.verify);
route.delete("/clearfilebank", controller.deleteFileBank);

module.exports = route;
