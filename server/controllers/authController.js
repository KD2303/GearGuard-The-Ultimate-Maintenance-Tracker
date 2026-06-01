const User = require("../models/user");
const Session = require("../models/Session");
const { authRateLimiters } = require("../middleware/rateLimiter");

let dummyHash = '';
require('bcryptjs').hash('dummy_password', 10).then(hash => dummyHash = hash);
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  ErrorHandler,
  ERROR_TYPES,
} = require("../utils/errorHandler");
const { asyncHandler } = require("../middleware/errorHandler");

const generateAccessToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/// REGISTER
exports.register = asyncHandler(async (req, res, next) => {
  // NOTE: role is intentionally NOT destructured from req.body.
  // Role assignment from the client is explicitly blocked for security.
  // All new registrations default to 'Technician' role only.
  const { name, email, password } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    throw new ErrorHandler(
      "Name, email, and password are required.",
      ERROR_TYPES.VALIDATION_ERROR,
    );
  }

  if (password.length < 6) {
    throw new ErrorHandler(
      "Password must be at least 6 characters long.",
      ERROR_TYPES.VALIDATION_ERROR,
    );
  }

  // Check if email is already registered
  const existingUser = await User.findOne({
    email: email.toLowerCase().trim(),
  });
  if (existingUser) {
    throw new ErrorHandler(
      "An account with this email already exists.",
      ERROR_TYPES.DUPLICATE_ERROR,
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user — role is hardcoded to 'Technician', never from req.body
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role: "Technician", // SECURITY: always the base role, never from client
  });

  // Remove password before sending response
  const userObj = user.toObject();
  delete userObj.password;

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: userObj,
  });
});

// LOGIN
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    throw new ErrorHandler(
      "Email and password are required.",
      ERROR_TYPES.VALIDATION_ERROR,
    );
  }

  // Fetch user including hidden password and lockout fields
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password +lockUntil +failedLoginAttempts');

  // To prevent timing attacks, if user doesn't exist, compare with dummy hash
  const isMatch = await bcrypt.compare(password, user ? user.password : dummyHash);

  // If password doesn't match (or user doesn't exist)
  if (!isMatch) {
    // Consume rate limits on failure
    const ip = req.ip;
    const emailKey = email.toLowerCase().trim();
    try {
      await Promise.all([
        authRateLimiters.loginIpLimiter.consume(ip),
        authRateLimiters.loginIpUserLimiter.consume(`${ip}_${emailKey}`),
        authRateLimiters.loginUserLimiter.consume(emailKey)
      ]);
    } catch (rejRes) {
      // If consuming pushed them over the limit, it will be caught next time.
    }

    // SECURITY: Use identical error message for missing user and invalid password
    throw new ErrorHandler(
      "Invalid email or password.",
      ERROR_TYPES.AUTHENTICATION_ERROR,
    );
  }

  // At this point, password is CORRECT.
  // We can safely tell them if their account is locked by an admin/system
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    return res.status(423).json({
      success: false,
      error: `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      lockUntil: user.lockUntil,
    });
  }

  // Successful login — reset limiters for this user/IP combo
  const ip = req.ip;
  const emailKey = email.toLowerCase().trim();
  authRateLimiters.loginIpUserLimiter.delete(`${ip}_${emailKey}`).catch(() => {});
  authRateLimiters.loginUserLimiter.delete(emailKey).catch(() => {});

  // Reset DB lockout fields if any
  if (user.failedLoginAttempts > 0 || user.lockUntil) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = crypto.randomBytes(40).toString("hex");
  const refreshTokenHash = hashToken(refreshToken);

  // Create session
  const session = await Session.create({
    userId: user._id,
    refreshTokenHash,
    deviceInfo: req.headers["user-agent"] || "Unknown Device",
    ipAddress: req.ip || req.connection.remoteAddress,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  // Attach session ID to refresh token to easily look it up later
  const finalRefreshToken = `${session._id}.${refreshToken}`;

  // Send HttpOnly cookie
  res.cookie("gearguard_refresh_token", finalRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    token: accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// REFRESH TOKEN
exports.refresh = asyncHandler(async (req, res, next) => {
  const token = req.cookies.gearguard_refresh_token;

  if (!token) {
    throw new ErrorHandler("No refresh token provided", ERROR_TYPES.AUTHENTICATION_ERROR);
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    throw new ErrorHandler("Invalid token format", ERROR_TYPES.AUTHENTICATION_ERROR);
  }

  const [sessionId, refreshToken] = parts;

  const session = await Session.findById(sessionId).populate("userId");
  
  if (!session || !session.userId) {
    throw new ErrorHandler("Session not found", ERROR_TYPES.AUTHENTICATION_ERROR);
  }

  const incomingHash = hashToken(refreshToken);

  // Reuse Detection
  if (session.usedTokenHashes.includes(incomingHash)) {
    // SECURITY: The token was already used! Revoke session immediately.
    session.isValid = false;
    await session.save();
    console.warn(`Token reuse detected for user ${session.userId._id}. Session revoked.`);
    throw new ErrorHandler("Token compromise detected. Session revoked.", ERROR_TYPES.AUTHENTICATION_ERROR);
  }

  if (!session.isValid) {
    throw new ErrorHandler("Session has been revoked", ERROR_TYPES.AUTHENTICATION_ERROR);
  }

  if (session.refreshTokenHash !== incomingHash) {
    throw new ErrorHandler("Invalid refresh token", ERROR_TYPES.AUTHENTICATION_ERROR);
  }

  // Token is valid. Rotate it.
  const newRefreshToken = crypto.randomBytes(40).toString("hex");
  const newHash = hashToken(newRefreshToken);

  session.usedTokenHashes.push(incomingHash);
  session.refreshTokenHash = newHash;
  session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await session.save();

  const finalNewRefreshToken = `${session._id}.${newRefreshToken}`;

  res.cookie("gearguard_refresh_token", finalNewRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const newAccessToken = generateAccessToken(session.userId._id, session.userId.role);

  res.status(200).json({
    success: true,
    token: newAccessToken,
  });
});

// LOGOUT
exports.logout = asyncHandler(async (req, res, next) => {
  const token = req.cookies.gearguard_refresh_token;

  if (token) {
    const parts = token.split(".");
    if (parts.length === 2) {
      const sessionId = parts[0];
      await Session.findByIdAndUpdate(sessionId, { isValid: false });
    }
  }

  res.clearCookie("gearguard_refresh_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// LOGOUT ALL
exports.logoutAll = asyncHandler(async (req, res, next) => {
  // We need req.user to know which user to logout. 
  // Assuming this route is protected by auth middleware.
  if (!req.user || !req.user._id) {
    throw new ErrorHandler("Not authenticated", ERROR_TYPES.AUTHENTICATION_ERROR);
  }

  await Session.updateMany(
    { userId: req.user._id },
    { $set: { isValid: false } }
  );

  res.clearCookie("gearguard_refresh_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({
    success: true,
    message: "Logged out from all devices",
  });
});

// GET CURRENT USER
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) {
    throw new ErrorHandler("User not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }
  res.status(200).json({
    success: true,
    user,
  });
});

// UPDATE USER ROLE (Admin only)
exports.updateUserRole = asyncHandler(async (req, res, next) => {
  // Only admins can change roles
  if (!req.user || req.user.role !== "Admin") {
    throw new ErrorHandler(
      "Access denied. Only admins can change user roles.",
      ERROR_TYPES.AUTHORIZATION_ERROR,
    );
  }

  const { userId } = req.params;
  const { role } = req.body;

  const allowedRoles = ["Admin", "Manager", "Technician"];
  if (!role || !allowedRoles.includes(role)) {
    throw new ErrorHandler(
      `Role must be one of: ${allowedRoles.join(", ")}`,
      ERROR_TYPES.VALIDATION_ERROR,
    );
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true, runValidators: true },
  ).select("-password");

  if (!user) {
    throw new ErrorHandler("User not found.", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  res.status(200).json({
    success: true,
    message: `User role updated to '${role}' successfully.`,
    user,
  });
});

// UNLOCK USER (Admin only)
exports.unlockUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('+failedLoginAttempts +lockUntil');

  if (!user) {
    throw new ErrorHandler("User not found.", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: `Account for ${user.email} has been unlocked.`,
  });
});
