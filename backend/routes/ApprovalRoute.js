const express = require("express");
const router = express.Router();
const Approval = require("../controllers/ApprovalController");

router.post("/submitrole", Approval.AddNewRole);
router.post("/deleterole", Approval.DeleteRole);
router.post("/flowsubmit", Approval.CreateNewFlow);
router.patch("/flowsubmit", Approval.CreateNewFlow);
router.get("/", Approval.GetTicketFlow);

module.exports = router;
