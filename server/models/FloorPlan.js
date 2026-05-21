const { mongoose } = require('../config/database');
const { Schema } = mongoose;

const FloorPlanSchema = new Schema({
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

FloorPlanSchema.index({ isActive: 1 });

module.exports = mongoose.model('FloorPlan', FloorPlanSchema);
