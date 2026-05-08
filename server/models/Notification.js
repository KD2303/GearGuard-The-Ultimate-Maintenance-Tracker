const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {   // 🔥 ADD THIS
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "request_created",
        "request_updated",
        "request_completed",
        "request_deleted",
        "system",
      ],
    },

    message: {
      type: String,
      required: true,
    },

    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MaintenanceRequest",
    },

    read: {
      type: Boolean,
      default: false,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;