const AuditLog = require('../models/AuditLog');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getEntityAuditTrail = asyncHandler(async (req, res) => {
  const { entityType, id } = req.params;

  const logs = await AuditLog.find({ entityType, entityId: id })
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 });

  res.status(200).json(logs);
});
