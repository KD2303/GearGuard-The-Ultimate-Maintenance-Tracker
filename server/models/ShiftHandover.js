const mongoose = require('mongoose');

const shiftHandoverSchema = new mongoose.Schema({
  shiftDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  shiftType: {
    type: String,
    required: true,
    enum: ['Morning', 'Afternoon', 'Night']
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeamMember',
    required: true
  },
  notes: {
    type: String,
    required: true
  },
  safetyWarnings: {
    type: String
  },
  ongoingRepairs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceRequest'
  }],
  acknowledgedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeamMember'
  }]
}, { timestamps: true });

module.exports = mongoose.model('ShiftHandover', shiftHandoverSchema);
