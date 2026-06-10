const { mongoose } = require('../config/database');
const { Schema } = mongoose;
const { encryptField, decryptField } = require('../utils/fieldEncryption');

const MaintenanceRequestSchema = new Schema({
  requestNumber: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['corrective', 'preventive', 'predictive'], default: 'corrective' },
  stage: { type: String, enum: ['new', 'in-progress', 'repaired', 'scrap'], default: 'new' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  requiredSkills: [{ type: String }],
  scheduledDate: { type: Date },
  completedDate: { type: Date },
  duration: { type: Number },
  cost: { type: Number },
  partsCost: { type: Number, default: 0 },
  laborCost: { type: Number, default: 0 },
  // notes holds sensitive repair findings and cost commentary. It is encrypted
  // at rest with AES-256-GCM via transparent get and set functions. It is not
  // part of any text index, so encryption does not affect search.
  notes: {
    type: String,
    set: encryptField,
    get: decryptField,
  },
  overdueNotified: {
    type: Boolean,
    default: false,
  },
  completionProcessed: {
    type: Boolean,
    default: false,
  },
  slaDeadline: { type: Date },
  slaBreachProbability: { type: Number, default: 0, min: 0, max: 100 },
  preBreachWarningSent: { type: Boolean, default: false },
  slaBreached: { type: Boolean, default: false },
  slaNotified: { type: Boolean, default: false },
  attachments: [
  {
    filename: { type: String },
    fileUrl: { type: String },
    fileType: { type: String },
  },
],
  equipmentId: { type: Schema.Types.ObjectId, ref: 'Equipment' },
  teamId: { type: Schema.Types.ObjectId, ref: 'MaintenanceTeam' },
  assignedToId: { type: Schema.Types.ObjectId, ref: 'TeamMember' },
  createdById: { type: Schema.Types.ObjectId, ref: 'User' },
  partsUsed: [{
    partId: { type: Schema.Types.ObjectId, ref: 'SparePart' },
    quantityUsed: { type: Number, required: true, default: 1 }
  }],
  requiredParts: [{
    partId: { type: Schema.Types.ObjectId, ref: 'SparePart' },
    quantityNeeded: { type: Number, required: true, default: 1 }
  }],
  isBlockedAwaitingParts: { type: Boolean, default: false },
  comments: [{
    authorId: { type: Schema.Types.ObjectId, ref: 'TeamMember', required: true },
    authorName: { type: String, required: true },
    content: { type: String },
    audioUrl: { type: String },
    audioDuration: { type: Number },
    timestamp: { type: Date, default: Date.now }
  }],
  checkedOutTools: [{
    toolId: { type: Schema.Types.ObjectId, ref: 'Tool', required: true },
    checkedOutAt: { type: Date, default: Date.now }
  }],
  checklist: [{
    text: { type: String, required: true },
    isCompleted: { type: Boolean, default: false }
  }],
  lotoAudit: {
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    completedBy: { type: Schema.Types.ObjectId, ref: 'TeamMember' },
    proofImageUrl: { type: String },
    checklistResponses: [{
      step: { type: String },
      checked: { type: Boolean }
    }]
  },
  downtimeDurationHours: { type: Number, default: 0 },
  totalDowntimeCost: { type: Number, default: 0 },
  syncId: { type: String, default: null }, // UUID from offline device to prevent replay attacks or resolve conflicts
  vendorEscalation: {
    isEscalated: { type: Boolean, default: false },
    vendorEmail: { type: String },
    vendorCompany: { type: String },
    message: { type: String },
    magicToken: { type: String, select: false },
    tokenExpiresAt: { type: Date }
  },
  rootCause: { type: String }, // Used by the RCA logic tree wizard
  rcaNodeId: { type: Schema.Types.ObjectId, ref: 'DiagnosticNode' } // Final leaf node of the RCA tree
}, { timestamps: true });

MaintenanceRequestSchema.virtual('equipment', {
  ref: 'Equipment',
  localField: 'equipmentId',
  foreignField: '_id',
  justOne: true
});

MaintenanceRequestSchema.virtual('team', {
  ref: 'MaintenanceTeam',
  localField: 'teamId',
  foreignField: '_id',
  justOne: true
});

MaintenanceRequestSchema.virtual('assignedTo', {
  ref: 'TeamMember',
  localField: 'assignedToId',
  foreignField: '_id',
  justOne: true
});

MaintenanceRequestSchema.virtual('createdBy', {
  ref: 'User',
  localField: 'createdById',
  foreignField: '_id',
  justOne: true
});

// getters: true ensures the decrypt getter on notes runs when a document is
// serialized to an object or to JSON for API responses.
MaintenanceRequestSchema.set('toObject', { virtuals: true, getters: true });
MaintenanceRequestSchema.set('toJSON', { virtuals: true, getters: true });

// Indexes for optimized filtered queries
MaintenanceRequestSchema.index({ stage: 1 });
MaintenanceRequestSchema.index({ priority: 1 });
MaintenanceRequestSchema.index({ type: 1 });
MaintenanceRequestSchema.index({ assignedToId: 1 });
MaintenanceRequestSchema.index({ teamId: 1 });
MaintenanceRequestSchema.index({ scheduledDate: 1 });
MaintenanceRequestSchema.index({ slaDeadline: 1 });
MaintenanceRequestSchema.index({ slaBreachProbability: -1 });
MaintenanceRequestSchema.index({ slaBreached: 1 });
MaintenanceRequestSchema.index({ subject: 'text', requestNumber: 'text', description: 'text' });

module.exports = mongoose.model('MaintenanceRequest', MaintenanceRequestSchema);
