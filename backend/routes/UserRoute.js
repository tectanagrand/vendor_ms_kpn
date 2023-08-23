const express = require("express");
const router = express.Router();
const controller = require("../controllers/UserController");

router.get("/", controller.showAll);
router.post("/add", controller.createUser);
// router.put("/:id/edit", controller.editUser);
// router.get("/:id/edit", controller.getUserById);
// router.delete("/:id", controller.deleteUserId);

module.exports = router;
