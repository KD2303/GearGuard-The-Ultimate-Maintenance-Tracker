/**
 * Error Handler Utility
 * Provides centralized error handling with categorization and formatting
 * Supports detailed responses in development and generic responses in production
 */

// Error type constants
const ERROR_TYPES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR: "NOT_FOUND_ERROR",
  DUPLICATE_ERROR: "DUPLICATE_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
};

// HTTP status code mapping
const STATUS_CODES = {
  VALIDATION_ERROR: 400,
  AUTHENTICATION_ERROR: 401,
  AUTHORIZATION_ERROR: 403,
  NOT_FOUND_ERROR: 404,
  DUPLICATE_ERROR: 409,
  DATABASE_ERROR: 500,
  SERVER_ERROR: 500,
};

/**
 * Custom Error Handler Class
 * Extends Error to provide categorized error information
 */
class ErrorHandler extends Error {
  constructor(
    message,
    errorType = ERROR_TYPES.SERVER_ERROR,
    statusCode = null,
  ) {
    super(message);
    this.errorType = errorType;
    this.statusCode = statusCode || STATUS_CODES[errorType] || 500;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Format error response based on environment
 * Development: includes detailed information and stack traces
 * Production: includes only safe, generic messages
 */
function formatError(error, isDevelopment = false) {
  // Determine error type if not explicitly set
  let errorType = error.errorType || ERROR_TYPES.SERVER_ERROR;
  let statusCode = error.statusCode || STATUS_CODES[errorType] || 500;
  let message = error.message || "An unexpected error occurred";

  // Build response object
  const response = {
    success: false,
    error: {
      type: errorType,
      message: isDevelopment
        ? message
        : getProductionMessage(errorType, message),
      timestamp: new Date().toISOString(),
    },
  };

  // Add detailed information in development mode
  if (isDevelopment) {
    response.error.details = {
      stack: error.stack,
      originalError: error.originalError || null,
      code: error.code || null,
    };

    // Add MongoDB-specific error details
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      response.error.details.mongoError = `Duplicate key: ${field}`;
    }

    if (error.name === "ValidationError") {
      response.error.details.validationErrors = Object.entries(
        error.errors || {},
      ).map(([field, err]) => ({
        field,
        message: err.message,
      }));
    }
  }

  return { response, statusCode };
}

/**
 * Get generic error message for production
 */
function getProductionMessage(errorType, devMessage) {
  const messages = {
    VALIDATION_ERROR:
      "Invalid request data. Please check your input and try again.",
    AUTHENTICATION_ERROR: "Authentication failed. Please log in and try again.",
    AUTHORIZATION_ERROR: "You do not have permission to perform this action.",
    NOT_FOUND_ERROR: "The requested resource was not found.",
    DUPLICATE_ERROR: "This resource already exists.",
    DATABASE_ERROR: "A database error occurred. Please try again later.",
    SERVER_ERROR: "An unexpected error occurred. Please try again later.",
  };

  return messages[errorType] || "An error occurred. Please try again.";
}

/**
 * Categorize error and return ErrorHandler instance
 * Analyzes error properties to determine appropriate error type
 */
function categorizeError(error, defaultType = ERROR_TYPES.SERVER_ERROR) {
  // Handle MongoDB validation errors
  if (error.name === "ValidationError") {
    return new ErrorHandler(
      Object.values(error.errors)
        .map((e) => e.message)
        .join(", "),
      ERROR_TYPES.VALIDATION_ERROR,
    );
  }

  // Handle MongoDB duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "field";
    return new ErrorHandler(
      `A record with this ${field} already exists.`,
      ERROR_TYPES.DUPLICATE_ERROR,
    );
  }

  // Handle JWT errors
  if (error.name === "JsonWebTokenError") {
    return new ErrorHandler(
      "Invalid or malformed token",
      ERROR_TYPES.AUTHENTICATION_ERROR,
    );
  }

  if (error.name === "TokenExpiredError") {
    return new ErrorHandler(
      "Token has expired. Please log in again.",
      ERROR_TYPES.AUTHENTICATION_ERROR,
    );
  }

  // Handle Mongoose cast errors
  if (error.name === "CastError") {
    return new ErrorHandler(
      `Invalid ${error.path}: ${error.value}`,
      ERROR_TYPES.VALIDATION_ERROR,
    );
  }

  // Return as-is if already an ErrorHandler
  if (error instanceof ErrorHandler) {
    return error;
  }

  // Return default error
  const handledError = new ErrorHandler(
    error.message || "An unexpected error occurred",
    defaultType,
  );
  handledError.originalError = error;
  return handledError;
}

module.exports = {
  ErrorHandler,
  formatError,
  categorizeError,
  ERROR_TYPES,
  STATUS_CODES,
  getProductionMessage,
};
