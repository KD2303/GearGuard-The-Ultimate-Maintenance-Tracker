const { mongoose } = require('../config/database');
const { Schema } = mongoose;

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
  }]
}, { timestamps: true });

// Index for fast timeline queries
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
