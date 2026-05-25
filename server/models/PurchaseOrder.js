const { mongoose } = require('../config/database');
const { Schema } = mongoose;

const PurchaseOrderSchema = new Schema({
  poNumber: { type: String, required: true, unique: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  items: [{
    partId: { type: Schema.Types.ObjectId, ref: 'SparePart', required: true },
    quantityNeeded: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, default: 0 }
  }],
  totalCost: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'sent', 'received', 'cancelled'], default: 'draft' },
  orderDate: { type: Date },
  expectedDeliveryDate: { type: Date }
}, { timestamps: true });

// Auto-populate the supplier and items details when queried
PurchaseOrderSchema.pre(/^find/, function (next) {
  this.populate('supplierId', 'name contactEmail');
  this.populate('items.partId', 'name sku minReorderThreshold quantityInStock unitCost');
  next();
});

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
