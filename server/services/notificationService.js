const { Notification } = require("../models");

/**
 * Service to handle real-time notifications via Socket.IO
 */
class NotificationService {
  /**
   * Send a notification to connected clients and persist it in the DB
   * @param {Object} io - Socket.IO instance (passed from app.get('socketio'))
   * @param {Object} data - Notification data { type, message, requestId, priority }
   */
  static async sendNotification(io, data) {
    try {
      // 1. Persist to Database
      const notification = await Notification.create({
        userId: data.userId,   // 🔥 ADD THIS
        type: data.type,
        message: data.message,
        requestId: data.requestId,
        priority: data.priority || "medium",
      });

      // 2. Emit to Socket.IO
      // We emit to all connected clients for now. 
      // In a multi-tenant app, we would emit to specific rooms (user or team rooms).
      if (io) {
        io.emit("notification:new", notification);
      }

      return notification;
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  /**
   * Specialized method for request-related notifications
   */
  static async notifyRequestChange(io, type, request, action) {
    let message = "";
    let priority = "medium";

    const requestNo = request.requestNumber || "N/A";
    const equipmentName = request.equipment?.name || "Equipment";

    switch (type) {
      case "request_created":
        message = `New maintenance request created: ${requestNo} for ${equipmentName}`;
        priority = request.priority === "high" || request.priority === "critical" ? "high" : "medium";
        break;
      case "request_updated":
        message = `Request ${requestNo} has been updated (${action})`;
        priority = "medium";
        break;
      case "request_completed":
        message = `Request ${requestNo} is marked as COMPLETED!`;
        priority = "medium";
        break;
      case "request_deleted":
        message = `Request ${requestNo} has been removed.`;
        priority = "low";
        break;
      default:
        message = `Updates on request ${requestNo}`;
    }

    // 🔥 Decide who gets notification
    const userId = request.assignedToId || request.createdById;

    return this.sendNotification(io, {
      userId, // 🔥 ADD THIS
      type,
      message,
      requestId: request._id,
      priority,
    });
  }
}

module.exports = NotificationService;
