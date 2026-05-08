const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

// Get all notifications (user-specific)
router.get("/", verifyToken, notificationController.getNotifications);

// Get unread count
router.get("/unread/count", verifyToken, notificationController.getUnreadCount);

// Mark all as read
router.patch("/mark-all-read", verifyToken, notificationController.markAllAsRead);

// Mark single notification as read
router.patch("/:id/read", verifyToken, notificationController.markAsRead);

// Delete notification
router.delete("/:id", verifyToken, notificationController.deleteNotification);

module.exports = router;