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
        "request_assigned",
        "request_overdue",
        "equipment_status",
        "general"
      ],
      default: "general",
    },

    title: {
      type: String,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MaintenanceRequest",
    },

    relatedRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MaintenanceRequest",
    },

    relatedEquipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
    },

    link: {
      type: String,
      default: "/kanban",
    },

    read: {
      type: Boolean,
      default: false,
    },
    
    isRead: {
      type: Boolean,
      default: false,
      index: true,
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

// Index for fast unread count queries
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;