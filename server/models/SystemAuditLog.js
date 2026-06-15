const { mongoose } = require('../config/database');
const { Schema } = mongoose;

const SystemAuditLogSchema = new Schema({
  entityType: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  action: { type: String, required: true, enum: ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'PURCHASED', 'ASSIGNED', 'SCRAPPED', 'REPAIR_COMPLETED', 'LOTO_APPLIED', 'LOTO_REMOVED'] },
  description: { type: String },
  changes: [{
    field: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed
  }],
  hash: { type: String, required: true },
  previousHash: { type: String, required: true }
}, { timestamps: true });

// Prevent updates and deletions
SystemAuditLogSchema.pre('findOneAndUpdate', function(next) {
  next(new Error('SystemAuditLog is immutable. Updates are forbidden.'));
});
SystemAuditLogSchema.pre('updateOne', function(next) {
  next(new Error('SystemAuditLog is immutable. Updates are forbidden.'));
});
SystemAuditLogSchema.pre('updateMany', function(next) {
  next(new Error('SystemAuditLog is immutable. Updates are forbidden.'));
});
SystemAuditLogSchema.pre('deleteOne', function(next) {
  next(new Error('SystemAuditLog is immutable. Deletions are forbidden.'));
});
SystemAuditLogSchema.pre('deleteMany', function(next) {
  next(new Error('SystemAuditLog is immutable. Deletions are forbidden.'));
});
SystemAuditLogSchema.pre('remove', function(next) {
  next(new Error('SystemAuditLog is immutable. Deletions are forbidden.'));
});
SystemAuditLogSchema.pre('findOneAndDelete', function(next) {
  next(new Error('SystemAuditLog is immutable. Deletions are forbidden.'));
});
SystemAuditLogSchema.pre('findOneAndRemove', function(next) {
  next(new Error('SystemAuditLog is immutable. Deletions are forbidden.'));
});

// Index for fast timeline queries
SystemAuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('SystemAuditLog', SystemAuditLogSchema);
