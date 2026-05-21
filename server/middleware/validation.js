const { validationResult } = require('express-validator');
const { ERROR_TYPES, categorizeError } = require('../utils/errorHandler');

/**
 * Generic validation middleware using express-validator
 * Validates the request and passes errors to the global error handler
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors for our custom error handler
    const errorDetails = errors.array().reduce((acc, err) => {
      acc[err.path] = { message: err.msg };
      return acc;
    }, {});
    
    const err = new Error('Validation failed');
    err.name = 'ValidationError';
    err.errors = errorDetails;
    
    const handledError = categorizeError(err, ERROR_TYPES.VALIDATION_ERROR);
    return next(handledError);
  }
  next();
};

module.exports = {
  validate
};
