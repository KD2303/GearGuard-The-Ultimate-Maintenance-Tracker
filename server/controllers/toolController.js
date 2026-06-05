const { Tool } = require('../models');
const { ErrorHandler, ERROR_TYPES } = require('../utils/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getAllTools = asyncHandler(async (req, res, next) => {
  const tools = await Tool.find({}).sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    count: tools.length,
    data: tools
  });
});

exports.createTool = asyncHandler(async (req, res, next) => {
  const { name, serialNumber, purchaseCost } = req.body;
  if (!name || !serialNumber) {
    throw new ErrorHandler("Name and serial number are required", ERROR_TYPES.VALIDATION_ERROR);
  }
  const tool = await Tool.create(req.body);
  res.status(201).json({
    success: true,
    data: tool
  });
});

exports.updateTool = asyncHandler(async (req, res, next) => {
  const tool = await Tool.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!tool) {
    throw new ErrorHandler("Tool not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }
  res.status(200).json({
    success: true,
    data: tool
  });
});

exports.deleteTool = asyncHandler(async (req, res, next) => {
  const tool = await Tool.findByIdAndDelete(req.params.id);
  if (!tool) {
    throw new ErrorHandler("Tool not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }
  res.status(200).json({
    success: true,
    data: {}
  });
});
