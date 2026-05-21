const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  ErrorHandler,
  ERROR_TYPES,
} = require("../utils/errorHandler");
const { asyncHandler } = require("../middleware/errorHandler");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
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

  // Fetch user including hidden fields for lockout check
  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select('+password +failedLoginAttempts +lockUntil');

  if (!user) {
    // SECURITY: Use generic error message
    throw new ErrorHandler(
      "Invalid email or password.",
      ERROR_TYPES.AUTHENTICATION_ERROR,
    );
  }

  // Check if account is currently locked
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    // Send 423 directly to bypass production message overriding
    return res.status(423).json({
      success: false,
      error: `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      lockUntil: user.lockUntil,
    });
  }

  // Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    // Increment failed attempts
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    // Lock account after 5 failed attempts
    if (user.failedLoginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
      await user.save();
      return res.status(423).json({
        success: false,
        error: 'Account locked for 15 minutes due to too many failed login attempts.',
        lockUntil: user.lockUntil,
      });
    }

    await user.save();
    const attemptsLeft = 5 - user.failedLoginAttempts;
    return res.status(401).json({
      success: false,
      error: `Invalid email or password. ${attemptsLeft} attempt(s) remaining before account lockout.`,
    });
  }

  // Successful login — reset lockout fields
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  // Create token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
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
