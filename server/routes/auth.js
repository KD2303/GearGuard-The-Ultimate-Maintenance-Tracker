const express = require("express");
const router = express.Router();

const { register, login, getMe, updateUserRole } = require("../controllers/authController");
const protect = require("../middleware/auth");

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Get current user (protected)
router.get("/me", protect, getMe);

// Admin-only: update a user's role
router.patch("/users/:userId/role", protect, updateUserRole);

module.exports = router;