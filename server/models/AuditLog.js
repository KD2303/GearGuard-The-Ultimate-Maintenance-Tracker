const { mongoose } = require('../config/database');
const { Schema } = mongoose;
const crypto = require('crypto');

const AuditLogSchema = new Schema({
  entityType: { type: String, required: true }, // e.g. 'MaintenanceRequest', 'Equipment'
  entityId: { type: Schema.Types.ObjectId, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String }, // For convenience if user is deleted
  action: { type: String, required: true, enum: ['CREATE', 'UPDATE', 'DELETE'] },
  changes: [{
    field: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed
  }],
  // Enhanced audit fields for security-critical operations
  reason: { type: String, default: '' }, // Why was this action taken
  ipAddress: { type: String }, // Request IP address
  userAgent: { type: String }, // Browser/client user agent
  hash: { type: String, required: true },
  previousHash: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true });

// Index for fast timeline queries
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

// Index for monitoring security-critical operations
AuditLogSchema.index({ severity: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
