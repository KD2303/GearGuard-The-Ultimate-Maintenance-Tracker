const { Notification, Webhook } = require("../models");
const axios = require("axios");
const { scheduleEmailNotification } = require("../queue/emailQueue");

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
  REORDER: "Urgent: Spare Part Reorder Alert",
};
/**
 * Service to handle real-time notifications via Socket.IO
 */
class NotificationService {
  static setSocketIO(socketInstance) {
    this.io = socketInstance;
  }

  static async createAndEmit({
    userId,
    title,
    message,
    type = 'general',
    link = '/kanban',
    relatedRequestId,
    relatedEquipmentId,
  }) {
    try {
      const notification = await Notification.create({
        userId,
        title,
        message,
        type,
        link,
        relatedRequestId,
        relatedEquipmentId,
      });

      // Emit real-time event to the specific user's socket room
      if (this.io) {
        this.io.to(`user:${userId}`).emit('notification:new', notification);
      }

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error.message);
    }
  }

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
      // Emit to the specific user's room if userId is available
      if (io) {
        if (data.userId) {
          io.to(`user:${data.userId.toString()}`).emit("notification:new", notification);
        } else {
          io.emit("notification:new", notification);
        }
      }

      return notification;
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }
  /**
   * Send Email Notification with retry logic via queue
   * CRITICAL: All alerts are queued with exponential backoff
   * Prevents silent email failures when SMTP service is temporarily unavailable
   */
  static async sendEmail(to, subject, html) {
    try {
      if (!to) {
        console.error("Recipient email missing");
        return;
      }

      const job = await scheduleEmailNotification(to, subject, html);
      console.log(`[Email] Scheduled email notification: job ${job.id} to ${to}`);

      return job;
    } catch (error) {
      console.error("Failed to queue email notification:", error.message);
      throw error;
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

    // Webhook Integration: Push to Slack/Discord/Teams if High/Urgent
    if (type === "request_created" && (request.priority === "high" || request.priority === "urgent" || request.priority === "critical")) {
      const payloadText = `🚨 *Urgent Maintenance Required*\n*Equipment:* ${equipmentName}\n*Subject:* ${request.subject || 'N/A'}`;
      this.sendWebhookAlert('urgent_request', payloadText).catch(err => console.error("Webhook alert error:", err));
    }

    return this.sendNotification(io, {
      userId,
      type,
      message,
      requestId: request._id,
      priority,
    });
  }

  /**
   * Send Webhook Alert to configured third-party channels
   */
  static async sendWebhookAlert(event, messageText) {
    try {
      const webhooks = await Webhook.find({ isActive: true, events: event });
      
      const requests = webhooks.map(async (webhook) => {
        let payload = {};
        if (webhook.provider === 'Slack' || webhook.provider === 'Teams') {
          payload = { text: messageText };
        } else if (webhook.provider === 'Discord') {
          payload = { content: messageText };
        }
        
        try {
          await axios.post(webhook.url, payload, { timeout: 5000 });
        } catch (postErr) {
          console.error(`Failed to push webhook to ${webhook.provider}:`, postErr.message);
        }
      });

      await Promise.allSettled(requests);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
    }
  }
  static async notifyLowStock(io, part) {
    const message = `⚠️ Low Stock Alert: "${part.name}" has dropped to ${part.quantityInStock} units (threshold: ${part.minReorderThreshold}).`;
    
    let adminUserId = null;
    try {
      const User = require("../models/user");
      let adminUser = await User.findOne({ role: "Admin" });
      if (!adminUser) {
        adminUser = await User.findOne();
      }
      if (adminUser) {
        adminUserId = adminUser._id;
      }
    } catch (dbErr) {
      console.error("Failed to query Admin user for system notification:", dbErr);
    }

    if (adminUserId) {
      await this.sendNotification(io, {
        userId: adminUserId,
        type: "system",
        message,
        requestId: null,
        priority: "high",
      });
    }

    if (part.supplierEmail) {
      try {
        await this.sendEmail(
          part.supplierEmail,
          `Urgent: Spare Part Reorder Alert - ${part.name}`,
          this.reorderTemplate(part)
        );
      } catch (err) {
        console.error("Failed to send reorder email:", err);
      }
    }
  }

  static async sendOnDemandReorderEmail(part, quantity) {
    if (part.supplierEmail) {
      try {
        await this.sendEmail(
          part.supplierEmail,
          `[PROCUREMENT ORDER] Reorder Request - ${part.name}`,
          this.onDemandReorderTemplate(part, quantity)
        );
      } catch (err) {
        console.error("Failed to send on-demand reorder email:", err);
      }
    }
  }
}
NotificationService.reorderTemplate = (part) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #d9534f;">⚠️ Low Stock Alert: Procurement Required</h2>
      <p>The stock level for the following spare part has fallen below its safety threshold:</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 150px;">Part Name:</td>
          <td style="padding: 8px 0;">${part.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">SKU:</td>
          <td style="padding: 8px 0;"><code>${part.sku}</code></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Current Stock:</td>
          <td style="padding: 8px 0; color: #d9534f; font-weight: bold;">${part.quantityInStock}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Safety Threshold:</td>
          <td style="padding: 8px 0;">${part.minReorderThreshold}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Unit Cost:</td>
          <td style="padding: 8px 0;">₹${part.unitCost}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Storage Location:</td>
          <td style="padding: 8px 0;">${part.location || "N/A"}</td>
        </tr>
      </table>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 0.9em; color: #777;">Please contact the supplier at <strong>${part.supplierEmail || 'N/A'}</strong> to reorder units immediately.</p>
    </div>
  `;
};
NotificationService.onDemandReorderTemplate = (part, quantity) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #0d9488;">📦 Procurement Order: Spare Part Reorder</h2>
      <p>Please prepare and dispatch a shipment of the following spare part immediately:</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 150px;">Part Name:</td>
          <td style="padding: 8px 0;">${part.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">SKU:</td>
          <td style="padding: 8px 0;"><code>${part.sku}</code></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Requested Order Qty:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #0d9488;">${quantity} units</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Unit Cost:</td>
          <td style="padding: 8px 0;">₹${part.unitCost.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Total Cost Estimate:</td>
          <td style="padding: 8px 0; font-weight: bold;">₹${(part.unitCost * quantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Storage Location:</td>
          <td style="padding: 8px 0;">${part.location || "N/A"}</td>
        </tr>
      </table>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 0.9em; color: #777;">This is a system-generated procurement request from GearGuard. Please send the invoice quote to our accounting department.</p>
    </div>
  `;
};
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
