const { mongoose } = require('../config/database');
const { Schema } = mongoose;

const TaskSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  completed: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate: { type: Date },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  completedAt: { type: Date },
}, { timestamps: true });

TaskSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

TaskSchema.set('toObject', { virtuals: true });
TaskSchema.set('toJSON', { virtuals: true });

// Indexes for optimized queries
TaskSchema.index({ userId: 1 });
TaskSchema.index({ completed: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Task', TaskSchema);
