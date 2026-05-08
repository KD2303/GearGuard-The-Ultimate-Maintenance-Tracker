const { mongoose } = require('../config/database');
const { Schema } = mongoose;

const MaintenanceRequestSchema = new Schema({
  requestNumber: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['corrective', 'preventive'], default: 'corrective' },
  stage: { type: String, enum: ['new', 'in-progress', 'repaired', 'scrap'], default: 'new' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  scheduledDate: { type: Date },
  completedDate: { type: Date },
  duration: { type: Number },
  cost: { type: Number },
  notes: { type: String },
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
  createdById: { type: Schema.Types.ObjectId, ref: 'TeamMember' }
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
  ref: 'TeamMember',
  localField: 'createdById',
  foreignField: '_id',
  justOne: true
});

MaintenanceRequestSchema.set('toObject', { virtuals: true });
MaintenanceRequestSchema.set('toJSON', { virtuals: true });

// Indexes for optimized filtered queries
MaintenanceRequestSchema.index({ stage: 1 });
MaintenanceRequestSchema.index({ priority: 1 });
MaintenanceRequestSchema.index({ type: 1 });
MaintenanceRequestSchema.index({ assignedToId: 1 });
MaintenanceRequestSchema.index({ teamId: 1 });
MaintenanceRequestSchema.index({ scheduledDate: 1 });
MaintenanceRequestSchema.index({ subject: 'text', requestNumber: 'text', description: 'text' });

module.exports = mongoose.model('MaintenanceRequest', MaintenanceRequestSchema);
