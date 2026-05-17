# Error Handling System Documentation

## Overview

GearGuard implements a comprehensive, categorized error handling system that provides:

- **Development Mode**: Detailed error messages, stack traces, and debugging information
- **Production Mode**: Generic, user-friendly error messages to protect sensitive data
- **Consistency**: Standardized error format across all endpoints
- **Categorization**: Seven error types for precise error handling

## Error Types

```javascript
VALIDATION_ERROR; // 400: Invalid input/request data
AUTHENTICATION_ERROR; // 401: Auth failed, login needed
AUTHORIZATION_ERROR; // 403: Access denied/insufficient permissions
NOT_FOUND_ERROR; // 404: Resource not found
DUPLICATE_ERROR; // 409: Resource already exists
DATABASE_ERROR; // 500: Database operation failed
SERVER_ERROR; // 500: Unexpected server error
```

## Architecture

### 1. Error Handler Utility (`server/utils/errorHandler.js`)

The `ErrorHandler` class extends Error with categorization support:

```javascript
const { ErrorHandler, ERROR_TYPES } = require("../utils/errorHandler");

// Create a typed error
throw new ErrorHandler("User not found", ERROR_TYPES.NOT_FOUND_ERROR);

// Custom status code (optional)
throw new ErrorHandler(
  "Unauthorized access",
  ERROR_TYPES.AUTHORIZATION_ERROR,
  403,
);
```

### 2. Error Middleware (`server/middleware/errorHandler.js`)

Two main exports:

#### `asyncHandler(fn)` - Wraps async route handlers

```javascript
const { asyncHandler } = require("../middleware/errorHandler");

// Instead of try-catch, wrap your handler:
exports.myRoute = asyncHandler(async (req, res, next) => {
  // Any thrown error automatically caught and formatted
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ErrorHandler("User not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }
  res.json({ success: true, user });
});
```

#### `errorMiddleware` - Global error handler

Automatically:

- Catches all thrown/passed errors
- Categorizes them if needed
- Formats based on environment (dev vs prod)
- Logs errors server-side
- Sends appropriate response

**Must be registered AFTER all routes** in `server/index.js`:

```javascript
const { errorMiddleware } = require("./middleware/errorHandler");

// ... all routes here ...

app.use(errorMiddleware); // After routes, before 404 handler
```

## Migration Guide: Converting Controllers

### Before (Old Pattern)

```javascript
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};
```

### After (New Pattern)

```javascript
const { asyncHandler } = require("../middleware/errorHandler");
const { ErrorHandler, ERROR_TYPES } = require("../utils/errorHandler");

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ErrorHandler("User not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});
```

**Benefits:**

- No try-catch boilerplate
- No manual console.log calls
- Automatic error categorization
- Consistent response format
- Errors automatically formatted for dev/prod

## Common Patterns

### Validation Error

```javascript
if (!email || !password) {
  throw new ErrorHandler(
    "Email and password are required.",
    ERROR_TYPES.VALIDATION_ERROR,
  );
}
```

### Authentication Error

```javascript
const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) {
  throw new ErrorHandler(
    "Invalid credentials.",
    ERROR_TYPES.AUTHENTICATION_ERROR,
  );
}
```

### Authorization Error

```javascript
if (req.user.role !== "Admin") {
  throw new ErrorHandler(
    "Admin access required.",
    ERROR_TYPES.AUTHORIZATION_ERROR,
  );
}
```

### Duplicate Error (Handled Automatically)

MongoDB duplicate key errors are automatically caught:

```javascript
// Automatically becomes DUPLICATE_ERROR with readable message
const user = await User.create({ email, password });
```

### Not Found Error

```javascript
const equipment = await Equipment.findById(id);
if (!equipment) {
  throw new ErrorHandler("Equipment not found", ERROR_TYPES.NOT_FOUND_ERROR);
}
```

## Response Format

### Success Response (Unchanged)

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response - Development Mode

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Email and password are required.",
    "timestamp": "2026-05-17T18:30:00.000Z",
    "details": {
      "stack": "Error: Email and password are required.\n    at exports.login (/path/to/authController.js:45:13)\n    ...",
      "originalError": null,
      "code": null
    }
  }
}
```

### Error Response - Production Mode

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Invalid request data. Please check your input and try again.",
    "timestamp": "2026-05-17T18:30:00.000Z"
  }
}
```

## Special Case: MongoDB Errors

The error handler automatically categorizes common MongoDB errors:

### ValidationError

```javascript
// Mongoose schema validation failure
// Automatically caught and formatted as VALIDATION_ERROR
const user = await User.create({
  /* invalid data */
});
```

### Duplicate Key Error (11000)

```javascript
// Unique index violation
// Automatically caught and formatted as DUPLICATE_ERROR
const user = await User.create({ email: "existing@example.com" });
```

### CastError

```javascript
// Invalid ObjectId or type mismatch
// Automatically caught and formatted as VALIDATION_ERROR
```

### JWT Errors

```javascript
// TokenExpiredError, JsonWebTokenError
// Automatically caught and formatted as AUTHENTICATION_ERROR
```

## Logging

Errors are always logged server-side with context:

```
[2026-05-17T18:30:00.000Z] error: {
  message: "Email and password are required.",
  statusCode: 400,
  path: "/api/auth/login",
  method: "POST",
  userId: "anonymous",
  stack: "Error: ...\n    at ..."
}
```

In development, full stack traces are logged. In production, only essential information is logged.

## Checklist: Converting a Controller

- [ ] Add imports: `ErrorHandler`, `ERROR_TYPES`, `asyncHandler`
- [ ] Replace `async (req, res) =>` with `asyncHandler(async (req, res, next) =>`
- [ ] Remove all `try-catch` blocks
- [ ] Replace validation `return res.status(400).json(...)` with `throw new ErrorHandler(..., ERROR_TYPES.VALIDATION_ERROR)`
- [ ] Replace `return res.status(401).json(...)` with `throw new ErrorHandler(..., ERROR_TYPES.AUTHENTICATION_ERROR)`
- [ ] Replace `return res.status(403).json(...)` with `throw new ErrorHandler(..., ERROR_TYPES.AUTHORIZATION_ERROR)`
- [ ] Replace `return res.status(404).json(...)` with `throw new ErrorHandler(..., ERROR_TYPES.NOT_FOUND_ERROR)`
- [ ] Replace `return res.status(409).json(...)` with `throw new ErrorHandler(..., ERROR_TYPES.DUPLICATE_ERROR)`
- [ ] Replace `return res.status(500).json(...)` with `throw new ErrorHandler(..., ERROR_TYPES.SERVER_ERROR)`
- [ ] Add `success: true` to success responses
- [ ] Test in development mode (check detailed errors)
- [ ] Test in production mode (check generic messages)

## Testing Error Responses

### Development Mode

```bash
NODE_ENV=development npm run dev
# Errors include full stack traces and details
```

### Production Mode

```bash
NODE_ENV=production npm run dev
# Errors show generic messages only
```

### Example Test

```javascript
// Invalid password (development)
POST /api/auth/login
{ "email": "user@example.com", "password": "wrong" }

Response (dev):
{
  "success": false,
  "error": {
    "type": "AUTHENTICATION_ERROR",
    "message": "Invalid email or password.",
    "details": { "stack": "..." }
  }
}

Response (prod):
{
  "success": false,
  "error": {
    "type": "AUTHENTICATION_ERROR",
    "message": "Authentication failed. Please log in and try again."
  }
}
```

## Files Modified

- ✅ `server/utils/errorHandler.js` - New error utility
- ✅ `server/middleware/errorHandler.js` - New error middleware
- ✅ `server/index.js` - Integrated error middleware
- ✅ `server/controllers/authController.js` - Example conversion
- ✅ `server/controllers/equipmentController.js` - Example conversion

## Next Steps

Convert remaining controllers and middleware:

- `requestController.js`
- `teamController.js`
- `memberController.js`
- `notificationController.js`
- `adminController.js`
- `searchController.js`
- `predictiveController.js`
- Auth middleware
- Role middleware
- Upload middleware

Each follows the same pattern: import utilities, wrap with asyncHandler, replace error returns with throws.
