const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

// Get all notifications (user-specific)
router.get("/", protect, notificationController.getNotifications);

// 🔥 Get unread count (bonus feature)
router.get("/unread/count", protect, notificationController.getUnreadCount);

// Mark all as read
router.patch("/mark-all-read", protect, notificationController.markAllAsRead);

// Mark single as read
router.patch("/:id/read", protect, notificationController.markAsRead);

// Delete notification
router.delete("/:id", protect, notificationController.deleteNotification);

module.exports = router;