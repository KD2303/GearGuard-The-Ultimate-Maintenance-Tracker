const AuditLog = require('../models/AuditLog');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getEntityAuditTrail = asyncHandler(async (req, res) => {
  const { entityType, id } = req.params;

  const logs = await AuditLog.find({ entityType, entityId: id })
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 });

  res.status(200).json(logs);
});

const crypto = require('crypto');

exports.verifyLedgerIntegrity = asyncHandler(async (req, res) => {
  // Fetch all logs in chronological order
  const logs = await AuditLog.find().sort({ createdAt: 1 });
  
  if (logs.length === 0) {
    return res.status(200).json({ success: true, status: 'Intact', message: 'Ledger is empty.' });
  }

  let previousHash = 'GENESIS';

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];

    // Reconstruct payload as it was hashed
    const payload = {
      entityType: log.entityType,
      entityId: log.entityId,
      userId: log.userId,
      userName: log.userName,
      action: log.action,
      changes: log.changes.map(c => ({
        field: c.field,
        oldValue: c.oldValue,
        newValue: c.newValue
      }))
    };

    const hashString = previousHash + JSON.stringify(payload);
    const calculatedHash = crypto.createHash('sha256').update(hashString).digest('hex');

    if (log.previousHash !== previousHash || log.hash !== calculatedHash) {
      return res.status(200).json({
        success: false,
        status: 'Compromised',
        message: 'Cryptographic hash chain broken!',
        compromisedLogIndex: i,
        compromisedLogId: log._id,
        expectedHash: calculatedHash,
        actualHash: log.hash
      });
    }

    previousHash = log.hash;
  }

  res.status(200).json({
    success: true,
    status: 'Intact',
    message: 'Cryptographic ledger verified successfully. No tampering detected.',
    totalLogsVerified: logs.length
  });
});
