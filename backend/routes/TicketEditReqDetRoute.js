const express = require("express");
const TicketEditReqController = require("../controllers/TicketEditReqController");
const router = express.Router();
router.post("/neweditdet", TicketEditReqController.CreateNewEditDetail);
router.get("/getactive", TicketEditReqController.GetCurrentActiveReq);
// router.post(`/submit`, TicketEditReqController.SubmitTicket);
router.post("/process", TicketEditReqController.ProcessVendor);
router.get("/view", TicketEditReqController.GetByID);
router.post("/delfiletemp", TicketEditReqController.DeleteFileTemp);
router.post("/unflagdelete", TicketEditReqController.UnflagDelete);

module.exports = router;
