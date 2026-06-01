const { PurchaseOrder, SparePart } = require('../models');
const { ErrorHandler, ERROR_TYPES } = require('../utils/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');

// Get all purchase orders
exports.getPurchaseOrders = asyncHandler(async (req, res, next) => {
  const status = req.query.status;
  const filter = {};
  if (status) filter.status = status;
  
  const purchaseOrders = await PurchaseOrder.find(filter).sort({ createdAt: -1 });
  res.status(200).json(purchaseOrders);
});

// Create a PO manually (optional, mostly auto-drafted)
exports.createPurchaseOrder = asyncHandler(async (req, res, next) => {
  const poNumber = 'PO-' + Math.floor(100000 + Math.random() * 900000);
  const po = await PurchaseOrder.create({ ...req.body, poNumber });
  res.status(201).json(po);
});

const { withTransactionFallback } = require('../utils/transaction');

// Update a purchase order's status (Approve & Send, or Mark Received)
exports.updatePurchaseOrderStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['draft', 'sent', 'received', 'cancelled'].includes(status)) {
    throw new ErrorHandler("Invalid status provided", ERROR_TYPES.VALIDATION_ERROR);
  }

  const updatedPO = await withTransactionFallback(async (session) => {
    const po = await PurchaseOrder.findById(id).session(session);
    if (!po) {
      throw new ErrorHandler("Purchase Order not found", ERROR_TYPES.NOT_FOUND_ERROR);
    }

    const oldStatus = po.status;
    po.status = status;
    if (status === 'sent') po.orderDate = new Date();
    await po.save({ session });

    // If status is changed to received, we must update inventory atomically for all items
    if (oldStatus !== 'received' && status === 'received') {
      for (const item of po.items) {
        const updatedPart = await SparePart.findByIdAndUpdate(
          item.partId,
          { $inc: { quantityInStock: item.quantityNeeded } },
          { new: true, session }
        );

        // Clear low-stock flag if safe
        if (updatedPart && updatedPart.quantityInStock > updatedPart.minReorderThreshold && updatedPart.reorderStatus !== 'ok') {
          await SparePart.findByIdAndUpdate(item.partId, { reorderStatus: 'ok' }, { session });
        }
      }
    }

    return await PurchaseOrder.findById(id).session(session);
  });

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
