const express = require("express");
const router = express.Router();
const {
  getPurchaseOrders,
  updatePurchaseOrderStatus,
  deletePurchaseOrder
} = require("../controllers/purchaseOrderController");
const verifyToken = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

// Base route is /api/v1/purchase-orders
router.use(verifyToken); // Require authentication for all PO routes

router.get("/", getPurchaseOrders);
router.put("/:id/status", adminOnly, updatePurchaseOrderStatus); // Only admins can approve/receive POs
router.delete("/:id", adminOnly, deletePurchaseOrder);

module.exports = router;
