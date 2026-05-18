/**
 * EXAMPLE: Error Handling Implementation Guide
 * This file demonstrates proper usage of the new error handling system
 * Copy patterns from this file when converting other controllers
 */

// ============================================================================
// STEP 1: IMPORTS (Required for every controller using new error handling)
// ============================================================================

const { ErrorHandler, ERROR_TYPES } = require("../utils/errorHandler");
const { asyncHandler } = require("../middleware/errorHandler");

// Your other imports
const SomeModel = require("../models/SomeModel");
const validateInput = require("../utils/validators");

// ============================================================================
// PATTERN 1: Simple CRUD Operations
// ============================================================================

// GET (Fetch single resource)
exports.getSingleResource = asyncHandler(async (req, res, next) => {
  const resource = await SomeModel.findById(req.params.id);

  if (!resource) {
    throw new ErrorHandler("Resource not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  res.status(200).json({
    success: true,
    data: resource,
  });
});

// GET ALL (Fetch with optional filters)
exports.getAllResources = asyncHandler(async (req, res, next) => {
  const query = {};

  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: "i" };
  }

  const resources = await SomeModel.find(query)
    .populate("relatedField")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: resources.length,
    data: resources,
  });
});

// POST (Create resource)
exports.createResource = asyncHandler(async (req, res, next) => {
  // Validate required fields
  const { name, email } = req.body;

  if (!name || !email) {
    throw new ErrorHandler(
      "Name and email are required.",
      ERROR_TYPES.VALIDATION_ERROR,
    );
  }

  // Additional validation
  if (email && !validateInput.isValidEmail(email)) {
    throw new ErrorHandler(
      "Invalid email format.",
      ERROR_TYPES.VALIDATION_ERROR,
    );
  }

  // Create resource
  const resource = await SomeModel.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
  });

  res.status(201).json({
    success: true,
    message: "Resource created successfully",
    data: resource,
  });
});

// PUT (Update resource)
exports.updateResource = asyncHandler(async (req, res, next) => {
  const { name, status } = req.body;

  // Validate if provided
  if (status && !["active", "inactive", "archived"].includes(status)) {
    throw new ErrorHandler(
      "Invalid status. Must be active, inactive, or archived.",
      ERROR_TYPES.VALIDATION_ERROR,
    );
  }

  const resource = await SomeModel.findByIdAndUpdate(
    req.params.id,
    { name, status },
    { new: true, runValidators: true },
  );

  if (!resource) {
    throw new ErrorHandler("Resource not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  res.status(200).json({
    success: true,
    message: "Resource updated successfully",
    data: resource,
  });
});

// DELETE (Remove resource)
exports.deleteResource = asyncHandler(async (req, res, next) => {
  const resource = await SomeModel.findByIdAndDelete(req.params.id);

  if (!resource) {
    throw new ErrorHandler("Resource not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  res.status(200).json({
    success: true,
    message: "Resource deleted successfully",
  });
});

// ============================================================================
// PATTERN 2: Authentication & Authorization
// ============================================================================

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new ErrorHandler(
      "Email and password are required.",
      ERROR_TYPES.VALIDATION_ERROR,
    );
  }

  // Find user
  const user = await SomeModel.findOne({ email });
  if (!user) {
    throw new ErrorHandler(
      "Invalid credentials.",
      ERROR_TYPES.AUTHENTICATION_ERROR,
    );
  }

  // Verify password
  const isPasswordValid = await user.verifyPassword(password);
  if (!isPasswordValid) {
    throw new ErrorHandler(
      "Invalid credentials.",
      ERROR_TYPES.AUTHENTICATION_ERROR,
    );
  }

  res.status(200).json({
    success: true,
    message: "Login successful",
    token: generateToken(user),
  });
});

exports.protectedRoute = asyncHandler(async (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    throw new ErrorHandler(
      "Authentication required.",
      ERROR_TYPES.AUTHENTICATION_ERROR,
    );
  }

  // Check authorization (admin only)
  if (req.user.role !== "Admin") {
    throw new ErrorHandler(
      "Admin access required.",
      ERROR_TYPES.AUTHORIZATION_ERROR,
    );
  }

  res.status(200).json({
    success: true,
    message: "Protected resource accessed",
  });
});

// ============================================================================
// PATTERN 3: Complex Business Logic with Multiple Error Types
// ============================================================================

exports.assignResourceToTeam = asyncHandler(async (req, res, next) => {
  const { resourceId, teamId } = req.body;

  // Validation
  if (!resourceId || !teamId) {
    throw new ErrorHandler(
      "Resource ID and Team ID are required.",
      ERROR_TYPES.VALIDATION_ERROR,
    );
  }

  // Authorization
  if (req.user.role !== "Manager" && req.user.role !== "Admin") {
    throw new ErrorHandler(
      "Only managers can assign resources.",
      ERROR_TYPES.AUTHORIZATION_ERROR,
    );
  }

  // Check resource exists
  const resource = await SomeModel.findById(resourceId);
  if (!resource) {
    throw new ErrorHandler("Resource not found.", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  // Check team exists
  const team = await Team.findById(teamId);
  if (!team) {
    throw new ErrorHandler("Team not found.", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  // Check for duplicates
  if (resource.teamId?.equals(teamId)) {
    throw new ErrorHandler(
      "Resource is already assigned to this team.",
      ERROR_TYPES.DUPLICATE_ERROR,
    );
  }

  // Perform update
  resource.teamId = teamId;
  await resource.save();

  res.status(200).json({
    success: true,
    message: "Resource assigned to team successfully",
    data: resource,
  });
});

// ============================================================================
// PATTERN 4: Batch Operations with Error Handling
// ============================================================================

exports.bulkUpdate = asyncHandler(async (req, res, next) => {
  const { ids, updateData } = req.body;

  // Validation
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ErrorHandler(
      "An array of IDs is required.",
      ERROR_TYPES.VALIDATION_ERROR,
    );
  }

  if (Object.keys(updateData || {}).length === 0) {
    throw new ErrorHandler(
      "Update data is required.",
      ERROR_TYPES.VALIDATION_ERROR,
    );
  }

  // Perform update
  const result = await SomeModel.updateMany({ _id: { $in: ids } }, updateData, {
    runValidators: true,
  });

  if (result.matchedCount === 0) {
    throw new ErrorHandler(
      "No resources found with the provided IDs.",
      ERROR_TYPES.NOT_FOUND_ERROR,
    );
  }

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} resources updated successfully`,
    matched: result.matchedCount,
    modified: result.modifiedCount,
  });
});

// ============================================================================
// PATTERN 5: External Service Integration
// ============================================================================

const externalService = require("../services/externalService");

exports.syncWithExternalService = asyncHandler(async (req, res, next) => {
  const { resourceId } = req.params;

  // Validate resource exists
  const resource = await SomeModel.findById(resourceId);
  if (!resource) {
    throw new ErrorHandler("Resource not found.", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  try {
    // Call external service
    const syncResult = await externalService.sync(resource);

    res.status(200).json({
      success: true,
      message: "Sync completed successfully",
      data: syncResult,
    });
  } catch (error) {
    // Service errors become DATABASE_ERROR or SERVER_ERROR
    throw new ErrorHandler(
      error.message || "Failed to sync with external service",
      ERROR_TYPES.DATABASE_ERROR,
    );
  }
});

// ============================================================================
// TIPS FOR IMPLEMENTATION
// ============================================================================

/*
✅ DO:
- Use asyncHandler for ALL controller methods
- Throw ErrorHandler for known, expected errors
- Check authorization early, validate input before queries
- Use specific error types to match HTTP status codes
- Include helpful, specific error messages
- Log sensitive information only in development
- Test both development and production modes

❌ DON'T:
- Use try-catch for async operations (asyncHandler handles it)
- Return res.status().json() for errors (throw instead)
- Console.log errors (middleware handles logging)
- Use generic SERVER_ERROR for validation errors
- Send sensitive data in production errors
- Mix old and new error handling patterns

🔍 DEBUGGING:
- Check server logs for full error details
- Use NODE_ENV=development to see stack traces in responses
- Test with invalid IDs, empty payloads, auth failures
- Verify error response format has success: false
*/
