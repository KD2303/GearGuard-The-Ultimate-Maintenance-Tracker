const AuditLog = require("../models/AuditLog");

/**
 * Deep compare two objects/values and return array of changed fields
 */
function getChanges(oldObj, newObj) {
  const changes = [];
  
  if (!oldObj) oldObj = {};
  if (!newObj) newObj = {};

  // Find all updated or added fields
  for (const key in newObj) {
    // Ignore mongoose specific fields and internal fields
    if (['_id', '__v', 'createdAt', 'updatedAt'].includes(key)) continue;

    const oldVal = oldObj[key];
    const newVal = newObj[key];

    // Simple stringify comparison for simplicity
    const oldStr = JSON.stringify(oldVal);
    const newStr = JSON.stringify(newVal);

    if (oldStr !== newStr) {
      // Don't log if both are effectively empty
      if ((oldVal === undefined || oldVal === null || oldVal === "") && 
          (newVal === undefined || newVal === null || newVal === "")) {
        continue;
      }
      changes.push({
        field: key,
        oldValue: oldVal,
        newValue: newVal
      });
    }
  }

  return changes;
}

/**
 * Log an audit trail entry. Non-blocking.
 */
async function auditLog({
  entityType,
  entityId,
  action,
  oldDoc,
  newDoc,
  userId,
  userName = ""
}) {
  try {
    let changes = [];
    if (action === 'UPDATE' && oldDoc && newDoc) {
      changes = getChanges(
        oldDoc.toObject ? oldDoc.toObject() : oldDoc,
        newDoc.toObject ? newDoc.toObject() : newDoc
      );
      if (changes.length === 0) return; // No real changes
    } else if (action === 'CREATE') {
      changes = [{ field: 'document', oldValue: null, newValue: 'Created' }];
    } else if (action === 'DELETE') {
      changes = [{ field: 'document', oldValue: 'Deleted', newValue: null }];
    }

    const lastLog = await AuditLog.findOne().sort({ createdAt: -1 });
    const previousHash = lastLog ? lastLog.hash : 'GENESIS';

    const payload = {
      entityType,
      entityId,
      userId,
      userName,
      action,
      changes
    };

    const hashString = previousHash + JSON.stringify(payload);
    const hash = require('crypto').createHash('sha256').update(hashString).digest('hex');

    await AuditLog.create({
      ...payload,
      previousHash,
      hash
    });
  } catch (err) {
    console.error("Audit logging failed:", err.message);
  }
}

module.exports = { auditLog, getChanges };
