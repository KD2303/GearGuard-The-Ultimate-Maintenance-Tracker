const { Supplier } = require('../models');
const { ErrorHandler, ERROR_TYPES } = require('../utils/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');
const { auditLog } = require('../utils/auditLogger');

// Get all suppliers
exports.getSuppliers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [suppliers, total] = await Promise.all([
    Supplier.find().sort({ name: 1 }).skip(skip).limit(limit),
    Supplier.countDocuments()
  ]);

  res.status(200).json({
    suppliers,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  });
});

// Create a supplier
exports.createSupplier = asyncHandler(async (req, res, next) => {
  const { name, contactEmail, phone, leadTimeDays, notes } = req.body;
  const supplierData = { name, contactEmail, phone, leadTimeDays, notes };
  
  const supplier = await Supplier.create(supplierData);

  await auditLog({
    entityType: 'Supplier',
    entityId: supplier._id,
    action: 'CREATE',
    userId: req.user?._id,
    userName: req.user?.name || '',
  });

  res.status(201).json(supplier);
});

// Update a supplier
exports.updateSupplier = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const allowedFields = ['name', 'contactEmail', 'phone', 'leadTimeDays', 'notes'];
  const updateData = {};
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  // Capture the document before the change so the audit trail records a diff.
  const oldDoc = await Supplier.findById(id);
  if (!oldDoc) {
    throw new ErrorHandler("Supplier not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  const supplier = await Supplier.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

  await auditLog({
    entityType: 'Supplier',
    entityId: supplier._id,
    action: 'UPDATE',
    oldDoc,
    newDoc: supplier,
    userId: req.user?._id,
    userName: req.user?.name || '',
  });

  res.status(200).json(supplier);
});

// Delete a supplier
exports.deleteSupplier = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const supplier = await Supplier.findByIdAndDelete(id);

  if (!supplier) {
    throw new ErrorHandler("Supplier not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  await auditLog({
    entityType: 'Supplier',
    entityId: supplier._id,
    action: 'DELETE',
    userId: req.user?._id,
    userName: req.user?.name || '',
  });

  res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
});
