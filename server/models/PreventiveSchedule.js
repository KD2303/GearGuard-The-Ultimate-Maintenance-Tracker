const mongoose = require('mongoose');

const preventiveScheduleSchema = new mongoose.Schema({
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceTeam'
  },
  assignedToId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeamMember'
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    required: true
  },
  intervalDays: {
    type: Number,
    min: 1
  },
  nextRunAt: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastRunAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PreventiveSchedule', preventiveScheduleSchema);
