const { mongoose } = require('../config/database');
const { Schema } = mongoose;

const SparePartSchema = new Schema({
  name: { type: String, required: true },
  sku: { type: String, required: [true, 'SKU is required'], unique: true, trim: true },
  quantityInStock: { type: Number, required: true, default: 0 },
  quantityReserved: { type: Number, default: 0 },
  unitCost: { type: Number, required: true, default: 0 },
  minReorderThreshold: { type: Number, required: true, default: 5 },
  supplierEmail: { type: String },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  leadTimeDays: { type: Number, default: 7 },
  location: { type: String }, // shelf location e.g. Shelf A-4
  reorderStatus: { type: String, enum: ['ok', 'low-stock', 'reordered'], default: 'ok' }
}, { timestamps: true });

SparePartSchema.set('toObject', { virtuals: true });
SparePartSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('SparePart', SparePartSchema);
