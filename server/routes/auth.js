const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const { register, login, getMe, updateUserRole, unlockUser } = require("../controllers/authController");
const verifyToken = require("../middleware/auth"); // default export, aliased to match main branch convention
const { authLimiter, registerLimiter } = require("../middleware/rateLimiter");
const adminOnly = require("../middleware/adminOnly");
const { validate } = require("../middleware/validation");

// Register validation rules
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required').trim().escape(),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

// Login validation rules
const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// Register
router.post("/register", registerLimiter, registerValidation, validate, register);

// Login
router.post("/login", authLimiter, loginValidation, validate, login);

// Get current user (protected)
router.get("/me", verifyToken, getMe);

// Admin-only: update a user's role
router.patch("/users/:userId/role", verifyToken, updateUserRole);

// Admin-only: unlock user account
router.patch("/users/:id/unlock", verifyToken, adminOnly, unlockUser);

module.exports = router;