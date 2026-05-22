const { mongoose } = require('../config/database');
const { Schema } = mongoose;

const SupplierSchema = new Schema({
  name: { type: String, required: true },
  contactEmail: { type: String },
  phone: { type: String },
  leadTimeDays: { type: Number, default: 7 },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Supplier', SupplierSchema);
