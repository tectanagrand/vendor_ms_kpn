const express = require("express");
const route = express.Router();
const controller = require("../controllers/VendorController");

route.get("/", controller.showAll);
route.post("/add/:id", controller.newbyVendor);
route.post("/:edit/:id"); // :edit => edit, delete ; :id => id of bankv_id
route.post("/uploadtemp", controller.setTempFile);
route.get("/temp/:id", controller.getFile);

module.exports = route;
