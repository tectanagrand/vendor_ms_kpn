const express = require("express");
const router = express.Router();
const CGApiController = require("../controllers/CGApiController");
const CGMiddleware = require("../middleware/CGMiddleware");
const TokenManager = require("../middleware/tokenmanager");

router.get(
    "/",
    TokenManager.authSession,
    CGMiddleware.CheckSessionExist,
    CGApiController.Example,
    CGMiddleware.ErrorHandler
);

router.get(
    "/dataven",
    TokenManager.authSession,
    CGMiddleware.CheckSessionExist,
    CGApiController.GetVendorCG,
    CGMiddleware.ErrorHandler
);

module.exports = router;
