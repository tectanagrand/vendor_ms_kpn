const express = require("express");
const router = express.Router();
const controller = require("../controllers/UserController");
const AuthToken = require("../middleware/tokenmanager");

router.get("/", controller.showAll);
router.post("/login", controller.loginUser);
router.get("/refresh", controller.refreshToken);
router.post(
    "/authorization",
    AuthToken.authSession,
    controller.getAuthorization
);
router.get("/check", controller.check);
router.get("/lssecmtx", controller.showExistSecGrp);
router.get("/roles", controller.showRole);
router.get("/mgrs", controller.showManagers);
router.get("/show", controller.showUserData);
router.post("/secmtx", controller.showSecurityGroup);
router.post(
    "/secmtx/submit",
    AuthToken.authSession,
    controller.submitSecurityGroup
);
router.post("/submit", AuthToken.authSession, controller.createNewUser);
router.post("/resetpwd", controller.otpresetPassword);
// router.put("/:id/edit", controller.editUser);
// router.get("/:id/edit", controller.getUserById);
// router.delete("/:id", controller.deleteUserId);

module.exports = router;
