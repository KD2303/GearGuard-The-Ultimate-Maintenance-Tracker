const mongoose = require("mongoose");

const alertRuleSchema = new mongoose.Schema({
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Equipment",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  metricType: {
    type: String,
    enum: ["temperature", "vibration", "pressure", "humidity", "voltage"],
    required: true,
  },
  condition: {
    type: String,
    enum: [">", "<", ">=", "<=", "==", "!="],
    required: true,
  },
  threshold: {
    type: Number,
    required: true,
  },
  durationMinutes: {
    type: Number,
    default: 0, // 0 means alert immediately on first breach
    description: "How long the condition must be true before alerting"
  },
  actions: {
    createMaintenanceRequest: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "High",
    },
    sendNotification: {
      type: Boolean,
      default: true,
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }
}, { timestamps: true });

module.exports = mongoose.model("AlertRule", alertRuleSchema);
