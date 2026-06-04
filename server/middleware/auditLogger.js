const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');

function hashChanges(changes) {
  return crypto.createHash('sha256').update(JSON.stringify(changes)).digest('hex');
}

async function getLastHash(entityType, entityId) {
  try {
    const last = await AuditLog.findOne({ entityType, entityId }).sort({ createdAt: -1 });
    return last ? last.hash : 'initial';
  } catch {
    return 'initial';
  }
}

async function logAuditEvent(entityType, entityId, userId, userName, action, changes, ipAddress, userAgent, reason = '', severity = 'medium') {
  try {
    const previousHash = await getLastHash(entityType, entityId);
    const currentHash = hashChanges({ changes, previousHash });

    const log = new AuditLog({
      entityType,
      entityId,
      userId,
      userName,
      action,
      changes: Array.isArray(changes) ? changes : Object.entries(changes).map(([field, value]) => ({ field, newValue: value })),
      reason,
      ipAddress,
      userAgent,
      severity,
      hash: currentHash,
      previousHash
    });

    await log.save();
    console.log(`[AUDIT] ${action} on ${entityType}:${entityId} by ${userName}`);
    return log;
  } catch (error) {
    console.error(`[AUDIT ERROR] ${error.message}`);
  }
}

const auditMiddleware = (req, res, next) => {
  const criticalOps = {
    'DELETE': ['DELETE /api/v1/maintenance/:id', 'DELETE /api/v1/equipment/:id', 'DELETE /api/v1/work-orders/:id'],
    'CREATE': ['POST /api/v1/maintenance', 'POST /api/v1/equipment'],
    'UPDATE': ['PUT /api/v1/maintenance/:id', 'PUT /api/v1/equipment/:id']
  };

  const original = res.json;
  res.json = function(data) {
    if (res.statusCode < 400 && req.user && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
      logAuditEvent(
        'MaintenanceRequest',
        req.params.id || data?._id,
        req.user._id,
        req.user.name || req.user.email,
        req.method === 'DELETE' ? 'DELETE' : req.method === 'PUT' ? 'UPDATE' : 'CREATE',
        req.body,
        req.ip,
        req.headers['user-agent'],
        req.body?.reason || '',
        ['DELETE', 'POST'].includes(req.method) ? 'high' : 'medium'
      ).catch(err => console.error('[AUDIT] Async log failed:', err));
    }
    return original.call(this, data);
  };

  next();
};

module.exports = { auditMiddleware, logAuditEvent };
