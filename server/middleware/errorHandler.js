/**
 * Error Handling Middleware
 * Catches all errors from routes and controllers, formats them appropriately,
 * and sends responses based on environment (development vs production)
 */

const { formatError, categorizeError } = require("../utils/errorHandler");

/**
 * Main error middleware - should be placed AFTER all routes
 * Catches errors passed via next(error) in async/try-catch handlers
 */
const errorMiddleware = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV !== "production";

  // Categorize the error if it's not already an ErrorHandler
  let categorizedError = categorizeError(err);

  // Format error response based on environment
  const { response, statusCode } = formatError(categorizedError, isDevelopment);

  // Log error details for monitoring/debugging (always log on server side)
  const logLevel = statusCode >= 500 ? "error" : "warn";
  console[logLevel](
    `[${new Date().toISOString()}] ${categorizedError.errorType}:`,
    {
      message: categorizedError.message,
      statusCode,
      path: req.path,
      method: req.method,
      userId: req.user?.id || "anonymous",
      ...(isDevelopment && { stack: categorizedError.stack }),
    },
  );

  // Send error response
  return res.status(statusCode).json(response);
};

/**
 * Async error handler wrapper
 * Wraps async route handlers to catch errors and pass them to the error middleware
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorMiddleware,
  asyncHandler,
};
