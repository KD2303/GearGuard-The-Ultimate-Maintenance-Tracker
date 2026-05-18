const { Notification } = require("../models");
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
if (
  !process.env.SMTP_HOST ||
  !process.env.SMTP_PORT ||
  !process.env.SMTP_USER ||
  !process.env.SMTP_PASS
) {
  console.warn("⚠️ SMTP environment variables are missing.");
}
const EMAIL_SUBJECTS = {
  ASSIGNED: "New Maintenance Request Assigned",
  COMPLETED: "Maintenance Request Completed",
  OVERDUE: "Maintenance Request Overdue",
};
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
   * Send Email Notification
   */
  static async sendEmail(to, subject, html) {
    try {
      if (!to) {
        console.error("Recipient email missing");
        return;
      }

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      });

      console.log("✅ Email sent:", info.messageId);

      return info;
    } catch (error) {
      console.error("❌ Email sending failed:", error);
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
NotificationService.assignmentTemplate = (request) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2>📌 Request Assigned</h2>

      <p>A maintenance request has been assigned.</p>

      <hr />

      <p><strong>Request No:</strong> ${request.requestNumber}</p>
      <p><strong>Status:</strong> ${request.status}</p>
    </div>
  `;
};

NotificationService.completionTemplate = (request) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2>✅ Request Completed</h2>

      <p>Your maintenance request has been completed successfully.</p>

      <hr />

      <p><strong>Request No:</strong> ${request.requestNumber}</p>
    </div>
  `;
};

NotificationService.overdueTemplate = (request) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2>⚠️ Request Overdue</h2>

      <p>This maintenance request is overdue.</p>

      <hr />

      <p><strong>Request No:</strong> ${request.requestNumber}</p>
    </div>
  `;
};
NotificationService.EMAIL_SUBJECTS = EMAIL_SUBJECTS;

module.exports = NotificationService;
