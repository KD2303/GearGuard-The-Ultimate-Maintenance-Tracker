const { Supplier } = require('../models');
const { ErrorHandler, ERROR_TYPES } = require('../utils/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');

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
  const supplier = await Supplier.create(req.body);
  res.status(201).json(supplier);
});

// Update a supplier
exports.updateSupplier = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const supplier = await Supplier.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  
  if (!supplier) {
    throw new ErrorHandler("Supplier not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  res.status(200).json(supplier);
});

// Delete a supplier
exports.deleteSupplier = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const supplier = await Supplier.findByIdAndDelete(id);

  if (!supplier) {
    throw new ErrorHandler("Supplier not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
});
