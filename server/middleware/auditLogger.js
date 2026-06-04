const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');

// Critical operations that should be logged
const CRITICAL_OPERATIONS = {
  'POST /api/v1/maintenance': { entityType: 'MaintenanceRequest', action: 'CREATE', severity: 'high' },
  'PUT /api/v1/maintenance/:id': { entityType: 'MaintenanceRequest', action: 'UPDATE', severity: 'medium' },
  'DELETE /api/v1/maintenance/:id': { entityType: 'MaintenanceRequest', action: 'DELETE', severity: 'high' },
  'POST /api/v1/equipment': { entityType: 'Equipment', action: 'CREATE', severity: 'medium' },
  'PUT /api/v1/equipment/:id': { entityType: 'Equipment', action: 'UPDATE', severity: 'medium' },
  'DELETE /api/v1/equipment/:id': { entityType: 'Equipment', action: 'DELETE', severity: 'high' },
  'POST /api/v1/work-orders': { entityType: 'WorkOrder', action: 'CREATE', severity: 'high' },
  'DELETE /api/v1/work-orders/:id': { entityType: 'WorkOrder', action: 'DELETE', severity: 'high' },
  'POST /api/v1/purchase-orders': { entityType: 'PurchaseOrder', action: 'CREATE', severity: 'medium' },
  'DELETE /api/v1/spare-parts/:id': { entityType: 'SparePart', action: 'DELETE', severity: 'medium' },
};

function hashChanges(changes) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(changes));
  return hash.digest('hex');
}

async function getLastAuditHash(entityType, entityId) {
  try {
    const lastLog = await AuditLog.findOne({ entityType, entityId })
      .sort({ createdAt: -1 });
    return lastLog ? lastLog.hash : 'initial';
  } catch (error) {
    console.error('Error fetching last audit hash:', error);
    return 'initial';
  }
}

async function logAuditEvent(
  entityType,
  entityId,
  userId,
  userName,
  action,
  changes,
  ipAddress,
  userAgent,
  reason = '',
  severity = 'medium'
) {
  try {
    const previousHash = await getLastAuditHash(entityType, entityId);
    const currentHash = hashChanges({ changes, previousHash });

    const auditLog = new AuditLog({
      entityType,
      entityId,
      userId,
      userName,
      action,
      changes: Array.isArray(changes) ? changes : Object.entries(changes).map(([field, value]) => ({ field, newValue: value })),
      ipAddress,
      userAgent,
      reason,
      severity,
      hash: currentHash,
      previousHash,
    });

    await auditLog.save();
    console.log(`[AUDIT] ${action} on ${entityType}:${entityId} by ${userName}`);
    return auditLog;
  } catch (error) {
    console.error(`[AUDIT ERROR] Failed to log audit event: ${error.message}`);
  }
}

const auditMiddleware = (req, res, next) => {
  // Skip audit logging for non-critical operations
  const routeKey = `${req.method} ${req.route?.path}`;
  const isCritical = Object.keys(CRITICAL_OPERATIONS).some(pattern => {
    const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
    return regex.test(routeKey);
  });

  if (!isCritical) {
    return next();
  }

  // Capture response for audit logging
  const originalJson = res.json;
  res.json = function(data) {
    if (res.statusCode < 400 && req.user) {
      // Extract critical operation info
      const pattern = Object.keys(CRITICAL_OPERATIONS).find(p => {
        const regex = new RegExp('^' + p.replace(/:[^/]+/g, '[^/]+') + '$');
        return regex.test(routeKey);
      });

      if (pattern) {
        const { entityType, action, severity } = CRITICAL_OPERATIONS[pattern];

        // Determine entity ID
        let entityId = req.params.id || data?._id;

        // Extract changes for UPDATE operations
        let changes = [];
        if (action === 'UPDATE' && req.body) {
          changes = Object.entries(req.body)
            .filter(([key]) => !key.startsWith('_'))
            .map(([field, newValue]) => ({ field, newValue }));
        } else if (action === 'CREATE' && data?._id) {
          changes = Object.entries(req.body)
            .filter(([key]) => !key.startsWith('_'))
            .map(([field, newValue]) => ({ field, newValue }));
        }

        // Log asynchronously to not block response
        logAuditEvent(
          entityType,
          entityId,
          req.user._id,
          req.user.name || req.user.email,
          action,
          changes,
          req.ip,
          req.headers['user-agent'],
          req.body?.reason || '',
          severity
        ).catch(err => console.error('[AUDIT] Async logging failed:', err));
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

module.exports = {
  auditMiddleware,
  logAuditEvent,
};
