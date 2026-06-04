const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const MaintenanceLogSchema = new mongoose.Schema({
  maintenanceRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceRequest',
    required: true,
  },
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Encrypted fields for sensitive information
  _encryptedDescription: String, // Encrypted maintenance work description
  _encryptedFindings: String, // Encrypted diagnostic findings
  _encryptedCostBreakdown: String, // Encrypted repair costs
  partsUsed: [{
    partId: mongoose.Schema.Types.ObjectId,
    quantity: Number,
    cost: Number, // This field should also be encrypted
  }],
  hoursSpent: Number,
  workStartTime: Date,
  workEndTime: Date,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending',
  },
  safetyIssues: [String], // Any safety concerns identified
  equipmentCondition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'critical'],
  },
  nextScheduledMaintenance: Date,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Encryption key derived from process secret (must be consistent)
const ENCRYPTION_SECRET = process.env.MAINTENANCE_LOG_ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-secret';

// Pre-save hook to encrypt sensitive fields
MaintenanceLogSchema.pre('save', function(next) {
  if (this.isModified('_encryptedDescription')) {
    this._encryptedDescription = encrypt(this._encryptedDescription, ENCRYPTION_SECRET);
  }
  if (this.isModified('_encryptedFindings')) {
    this._encryptedFindings = encrypt(this._encryptedFindings, ENCRYPTION_SECRET);
  }
  if (this.isModified('_encryptedCostBreakdown')) {
    this._encryptedCostBreakdown = encrypt(this._encryptedCostBreakdown, ENCRYPTION_SECRET);
  }
  next();
});

// Virtual getters for decrypted fields
MaintenanceLogSchema.virtual('description').get(function() {
  if (!this._encryptedDescription) return '';
  try {
    return decrypt(this._encryptedDescription, ENCRYPTION_SECRET);
  } catch (error) {
    console.error('Failed to decrypt description:', error);
    return '[DECRYPTION ERROR]';
  }
});

MaintenanceLogSchema.virtual('findings').get(function() {
  if (!this._encryptedFindings) return '';
  try {
    return decrypt(this._encryptedFindings, ENCRYPTION_SECRET);
  } catch (error) {
    console.error('Failed to decrypt findings:', error);
    return '[DECRYPTION ERROR]';
  }
});

MaintenanceLogSchema.virtual('costBreakdown').get(function() {
  if (!this._encryptedCostBreakdown) return {};
  try {
    return JSON.parse(decrypt(this._encryptedCostBreakdown, ENCRYPTION_SECRET));
  } catch (error) {
    console.error('Failed to decrypt cost breakdown:', error);
    return {};
  }
});

// Helper method to set encrypted fields
MaintenanceLogSchema.methods.setDescription = function(description) {
  this._encryptedDescription = description;
};

MaintenanceLogSchema.methods.setFindings = function(findings) {
  this._encryptedFindings = findings;
};

MaintenanceLogSchema.methods.setCostBreakdown = function(breakdown) {
  this._encryptedCostBreakdown = JSON.stringify(breakdown);
};

module.exports = mongoose.model('MaintenanceLog', MaintenanceLogSchema);
