const express = require("express");
const router = express.Router();
const { getEntityAuditTrail, verifyLedgerIntegrity } = require("../controllers/auditController");
const { authorizeRoles } = require('../middleware/role');
const verifyToken = require("../middleware/auth");

router.use(verifyToken);

router.get("/verify", authorizeRoles("Admin"), verifyLedgerIntegrity);
router.get("/:entityType/:id", getEntityAuditTrail);

module.exports = router;
