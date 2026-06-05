const { mongoose } = require('../config/database');
const { Schema } = mongoose;

const EquipmentSchema = new Schema({
  name: { type: String, required: true },
  serialNumber: { type: String, required: [true, 'Serial number is required'], unique: true, trim: true },
  category: { type: String, required: true },
  department: { type: String },
  assignedTo: { type: String },
  location: { type: String, required: true },
  purchaseDate: { type: Date },
  purchasePrice: { type: Number, default: 0 },
  expectedLifespanYears: { type: Number, default: 5 },
  salvageValue: { type: Number, default: 0 },
  warrantyExpiry: { type: Date },
  manufacturer: { type: String },
  model: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'scrapped', 'under-maintenance'], default: 'active' },
  licensePlate: { type: String, unique: true, sparse: true },
  currentMileage: { type: Number, default: 0 },
  fuelType: { type: String, enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'] },
  notes: { type: String },
  maintenanceTeamId: { type: Schema.Types.ObjectId, ref: 'MaintenanceTeam' },
  defaultTechnicianId: { type: Schema.Types.ObjectId, ref: 'TeamMember' },
  mapCoordinates: { 
    x: { type: Number },
    y: { type: Number }
  },
  floorPlanId: { type: Schema.Types.ObjectId, ref: 'FloorPlan' },
  
  healthScore: {
    type: Number,
    default: 100
  },
  healthScoreBreakdown: [{
    factor: { type: String },
    deduction: { type: Number }
  }],
  riskLevel: {
    type: String,
    default: "Healthy"
  },
  failureCount: {
    type: Number,
    default: 0
  },
  lastFailureDate: {
    type: Date
  },
  operatingHours: {
    type: Number,
    default: 0
  },
  temperatureCelsius: {
    type: Number,
    default: 25
  },
  vibrationAmplitude: {
    type: Number,
    default: 0.1
  },
  criticalThresholds: {
    maxHours: { type: Number, default: 2000 },
    maxTemp: { type: Number, default: 85 },
    maxVibration: { type: Number, default: 4.5 }
  },
  hourlyDowntimeCost: {
    type: Number,
    default: 0
  },
  lotoRequired: {
    type: Boolean,
    default: false
  },
  lotoChecklist: [{
    type: String
  documents: [{
    title: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String },
    docCategory: { type: String, enum: ['Manual', 'Schematic', 'Safety', 'Warranty', 'Other'], default: 'Manual' },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: String }
  }],
  history: [{
    eventType: { type: String, enum: ['PURCHASED', 'CREATED', 'STATUS_CHANGE', 'REPAIR_COMPLETED', 'ASSIGNED', 'SCRAPPED'], required: true },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String }
  }]
}, { timestamps: true });

EquipmentSchema.virtual('maintenanceTeam', {
  ref: 'MaintenanceTeam',
  localField: 'maintenanceTeamId',
  foreignField: '_id',
  justOne: true
});

EquipmentSchema.virtual('defaultTechnician', {
  ref: 'TeamMember',
  localField: 'defaultTechnicianId',
  foreignField: '_id',
  justOne: true
});

EquipmentSchema.set('toObject', { virtuals: true });
EquipmentSchema.set('toJSON', { virtuals: true });



module.exports = mongoose.model('Equipment', EquipmentSchema);
