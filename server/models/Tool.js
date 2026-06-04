const { mongoose } = require('../config/database');
const { Schema } = mongoose;

const ToolSchema = new Schema({
  name: { type: String, required: true },
  serialNumber: { type: String, required: true, unique: true },
  purchaseCost: { type: Number, default: 0 },
  status: { type: String, enum: ['Available', 'Checked Out', 'In Repair', 'Lost'], default: 'Available' },
}, { timestamps: true });

module.exports = mongoose.model('Tool', ToolSchema);
