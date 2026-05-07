const express = require("express");

const router = express.Router();

const { register, login, getMe } = require("../controllers/authController");

const { verifyToken } = require("../middleware/auth");

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Get current user (protected)
router.get("/me", verifyToken, getMe);

module.exports = router;