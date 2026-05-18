const express = require("express");
const router = express.Router();

const { register, login, getMe, updateUserRole } = require("../controllers/authController");
const verifyToken = require("../middleware/auth"); // default export, aliased to match main branch convention

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Get current user (protected)
router.get("/me", verifyToken, getMe);

// Admin-only: update a user's role
router.patch("/users/:userId/role", verifyToken, updateUserRole);

module.exports = router;