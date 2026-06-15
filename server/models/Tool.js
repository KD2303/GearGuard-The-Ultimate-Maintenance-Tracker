const { mongoose } = require('../config/database');
const { Schema } = mongoose;

const ToolSchema = new Schema({
  name: { type: String, required: true },
  serialNumber: { type: String, required: true, unique: true },
  purchaseCost: { type: Number, default: 0 },
  status: { type: String, enum: ['Available', 'Checked Out', 'In Repair', 'Lost'], default: 'Available' },
  isLoto: { type: Boolean, default: false },
  requiresCalibration: { type: Boolean, default: false },
  calibrationIntervalDays: { type: Number, default: 90 },
  lastCalibratedAt: { type: Date },
  nextCalibrationDue: { type: Date },
  calibrationNotified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Tool', ToolSchema);
