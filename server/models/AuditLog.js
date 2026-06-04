const mongoose = require('mongoose');
const crypto = require('crypto');

const auditLogSchema = new mongoose.Schema({
  entityType: {
    type: String,
    required: true,
    enum: ['MaintenanceRequest', 'Equipment', 'WorkOrder', 'SparePart', 'User']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  userName: String,
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE'],
    index: true
  },
  changes: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  reason: {
    type: String,
    default: ''
  },
  ipAddress: String,
  userAgent: String,
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  hash: {
    type: String,
    required: true
  },
  previousHash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, severity: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
