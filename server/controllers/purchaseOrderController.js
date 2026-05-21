const PurchaseOrder = require('../models/PurchaseOrder');
const { SparePart } = require('../models');
const { ErrorHandler, ERROR_TYPES } = require('../utils/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');

// Get all purchase orders
exports.getPurchaseOrders = asyncHandler(async (req, res, next) => {
  const status = req.query.status;
  const filter = {};
  if (status) {
    filter.status = status;
  }
  
  const purchaseOrders = await PurchaseOrder.find(filter)
    .populate('partId', 'name sku minReorderThreshold quantityInStock unitCost')
    .sort({ createdAt: -1 });
    
  res.status(200).json(purchaseOrders);
});

// Update a purchase order's status (Approve & Order, or Mark Received)
exports.updatePurchaseOrderStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['draft', 'ordered', 'received'].includes(status)) {
    throw new ErrorHandler("Invalid status provided", ERROR_TYPES.VALIDATION_ERROR);
  }

  const po = await PurchaseOrder.findById(id);
  if (!po) {
    throw new ErrorHandler("Purchase Order not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  const oldStatus = po.status;
  po.status = status;
  await po.save();

  // If status is changed to received, we must update inventory
  if (oldStatus !== 'received' && status === 'received') {
    const part = await SparePart.findById(po.partId);
    if (part) {
      part.quantityInStock += po.quantityNeeded;
      if (part.quantityInStock > part.minReorderThreshold) {
        part.reorderStatus = 'ok';
      }
      await part.save();
    }
  }

  const updatedPO = await PurchaseOrder.findById(id)
    .populate('partId', 'name sku minReorderThreshold quantityInStock unitCost');

  res.status(200).json({
    success: true,
    message: `Purchase Order status updated to ${status}`,
    purchaseOrder: updatedPO
  });
});

// Delete a PO
exports.deletePurchaseOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const po = await PurchaseOrder.findByIdAndDelete(id);
  
  if (!po) {
    throw new ErrorHandler("Purchase Order not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  res.status(200).json({
    success: true,
    message: "Purchase Order deleted successfully"
  });
});
