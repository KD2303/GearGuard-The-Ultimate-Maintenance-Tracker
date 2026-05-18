---
name: "Convert Controller to New Error Handling System"
about: "Template for converting a controller to use the new error handling system"
title: "Convert [ControllerName] to new error handling system"
labels: ["good first issue", "error-handling", "refactor"]
assignees: []
---

## Controller to Convert

- [ ] Select one: `requestController.js` | `teamController.js` | `memberController.js` | `adminController.js` | `notificationController.js` | `searchController.js` | `predictiveController.js`

## Overview

This issue involves converting a controller from the old error handling pattern to the new comprehensive error handling system implemented in PR #ABC.

## What You'll Do

1. Import the error utilities at the top of the controller
2. Wrap each function with `asyncHandler()`
3. Replace error returns with `throw new ErrorHandler()` statements
4. Update response format to include `success: true/false`

## Before & After Example

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
    res.status(500).json({ error: "Server error" });
  }
};
```

### After (New Pattern)

```javascript
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ErrorHandler("User not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }
  res.status(200).json({
    success: true,
    message: "User retrieved successfully",
    data: user,
  });
});
```

## Reference Materials

- 📖 **Guide**: See `server/docs/ERROR_HANDLING.md` (sections: "How to Use ErrorHandler" and "Common Patterns")
- 💡 **Examples**: See `server/docs/ERROR_HANDLING_EXAMPLES.js` (5 practical patterns)
- ✅ **Completed Examples**:
  - `server/controllers/authController.js` (4 functions, all error types)
  - `server/controllers/equipmentController.js` (6 functions, CRUD patterns)

## Step-by-Step Instructions

### Step 1: Add Imports

At the top of your controller file, add:

```javascript
const {
  ErrorHandler,
  ERROR_TYPES,
  asyncHandler,
} = require("../utils/errorHandler");
const { errorMiddleware } = require("../middleware/errorHandler");
```

### Step 2: Wrap Functions

For each exported function, change:

```javascript
exports.functionName = async (req, res) => {
```

to:

```javascript
exports.functionName = asyncHandler(async (req, res, next) => {
```

### Step 3: Replace Error Handling

Replace error returns like:

```javascript
return res.status(400).json({ error: "Validation failed" });
```

with:

```javascript
throw new ErrorHandler("Validation failed", ERROR_TYPES.VALIDATION_ERROR);
```

### Step 4: Add Success Responses

Update success responses to include `success: true`:

```javascript
res.status(200).json({
  success: true,
  message: "Operation successful",
  data: result,
});
```

### Step 5: Common Error Types to Use

| Scenario                   | Error Type           | Status |
| -------------------------- | -------------------- | ------ |
| Missing required fields    | VALIDATION_ERROR     | 400    |
| Invalid credentials        | AUTHENTICATION_ERROR | 401    |
| Insufficient permissions   | AUTHORIZATION_ERROR  | 403    |
| Resource not found         | NOT_FOUND_ERROR      | 404    |
| Email/item already exists  | DUPLICATE_ERROR      | 409    |
| Database connection failed | DATABASE_ERROR       | 500    |
| Unexpected error           | SERVER_ERROR         | 500    |

## Testing Checklist

### Unit Testing

- [ ] Development mode: Verify detailed errors with stack traces
- [ ] Production mode: Verify generic error messages
- [ ] All success cases: Verify success: true in responses
- [ ] All error cases: Verify appropriate error types

### Manual Testing

- [ ] Test with invalid input (should throw VALIDATION_ERROR)
- [ ] Test with missing resources (should throw NOT_FOUND_ERROR)
- [ ] Test permission checks (should throw AUTHORIZATION_ERROR)
- [ ] Test duplicate entries if applicable (should throw DUPLICATE_ERROR)

### Console Output

- [ ] Check server logs show full error context (path, method, userId)
- [ ] Verify no stack traces leak to production mode

## Acceptance Criteria

- [ ] All functions wrapped with `asyncHandler`
- [ ] All error returns replaced with `throw new ErrorHandler()`
- [ ] All responses include `success: true/false`
- [ ] Error types match scenarios
- [ ] No `try-catch` blocks remain
- [ ] Tests pass in development mode
- [ ] Tests pass in production mode
- [ ] No console errors during testing

## Notes

- This is a straightforward refactoring with a clear pattern
- Estimated time: 20-30 minutes
- No new business logic needed, just reformatting errors
- Refer to completed controllers if unsure about pattern

## Questions?

Refer to:

1. `ERROR_HANDLING.md` - Complete reference guide
2. `ERROR_HANDLING_EXAMPLES.js` - Practical code examples
3. `authController.js` or `equipmentController.js` - Working examples
4. `TESTING_ERROR_HANDLING.md` - Test procedures

---

**Related PR**: Comprehensive error handling system implementation
**Category**: Refactoring / Error Handling
**Difficulty**: Low (straightforward pattern application)
**Impact**: Medium (improves error reporting for end users and developers)
**Time Estimate**: 20-30 minutes
