const { mongoose } = require('../config/database');
const { Schema } = mongoose;

const PurchaseOrderSchema = new Schema({
  partId: { type: Schema.Types.ObjectId, ref: 'SparePart', required: true },
  quantityNeeded: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['draft', 'ordered', 'received'], default: 'draft' },
  supplierEmail: { type: String, required: true }
}, { timestamps: true });

// Auto-populate the spare part details when queried
PurchaseOrderSchema.pre(/^find/, function (next) {
  this.populate('partId', 'name sku minReorderThreshold quantityInStock unitCost');
  next();
});

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
