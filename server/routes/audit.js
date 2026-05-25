const express = require("express");
const router = express.Router();
const { getEntityAuditTrail } = require("../controllers/auditController");
const verifyToken = require("../middleware/auth");

router.use(verifyToken);

router.get("/:entityType/:id", getEntityAuditTrail);

module.exports = router;
