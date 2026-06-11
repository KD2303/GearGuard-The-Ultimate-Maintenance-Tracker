const mongoose = require('mongoose');

const SyncConflictSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  documentModel: {
    type: String,
    enum: ['MaintenanceRequest', 'Equipment', 'Inventory'],
    default: 'MaintenanceRequest'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  offlinePayload: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  serverDocument: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'ignored'],
    default: 'pending',
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolutionStrategy: {
    type: String,
    enum: ['accept_client', 'accept_server', 'manual_merge', null],
    default: null,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('SyncConflict', SyncConflictSchema);
