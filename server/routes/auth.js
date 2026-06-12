const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");

const { register, login, getMe, updateProfile, updateUserRole, unlockUser, refresh, logout, logoutAll } = require("../controllers/authController");
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

// Refresh Token
router.post("/refresh", refresh);

// Logout
router.post("/logout", logout);

// Logout All Devices (protected)
router.post("/logout-all", verifyToken, logoutAll);

// Get current user (protected)
router.get("/me", verifyToken, getMe);

// Update current user profile (protected)
router.put("/profile", verifyToken, updateProfile);

// Admin-only: update a user's role
router.patch("/users/:userId/role", verifyToken, updateUserRole);

// Admin-only: unlock user account
router.patch("/users/:id/unlock", verifyToken, adminOnly, unlockUser);

// SSO Callback Handler
const ssoCallback = (provider) => (req, res, next) => {
  passport.authenticate(provider, { session: false }, (err, user, info) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    if (err) {
      return res.redirect(`${clientUrl}/oauth-callback?error=Server Error`);
    }
    if (!user) {
      const msg = info ? info.message : 'Authentication failed';
      return res.redirect(`${clientUrl}/oauth-callback?error=${encodeURIComponent(msg)}`);
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.redirect(`${clientUrl}/oauth-callback?token=${token}`);
  })(req, res, next);
};

// Google SSO
router.get("/google", authLimiter, passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get("/google/callback", authLimiter, ssoCallback("google"));

// Microsoft SSO
router.get("/microsoft", authLimiter, passport.authenticate("microsoft", { prompt: "select_account", session: false }));
router.get("/microsoft/callback", authLimiter, ssoCallback("microsoft"));

module.exports = router;