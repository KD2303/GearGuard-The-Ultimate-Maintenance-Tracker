const { mongoose } = require('../config/database');
const { Schema } = mongoose;

const ToolAuditLogSchema = new Schema({
  toolId: { type: Schema.Types.ObjectId, ref: 'Tool', required: true },
  action: { type: String, enum: ['Checkout', 'Return', 'StatusChange', 'Created', 'Deleted'], required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  associatedRequestId: { type: Schema.Types.ObjectId, ref: 'MaintenanceRequest' },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('ToolAuditLog', ToolAuditLogSchema);
