# Testing the New Error Handling System

## Quick Test Guide

This guide shows how to test the new comprehensive error handling system in GearGuard.

## Setup

```bash
# Make sure you're in the GearGuard directory
cd GearGuard-Vivek

# Start in development mode to see full error details
NODE_ENV=development npm run dev

# Or in production mode to see generic messages
NODE_ENV=production npm run dev
```

## Test Scenarios

### 1. VALIDATION_ERROR - Missing Required Fields

**Endpoint**: `POST http://localhost:5000/api/auth/register`

**Request**:

```json
{
  "name": "John Doe"
  // Missing email and password
}
```

**Development Response**:

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Name, email, and password are required.",
    "timestamp": "2026-05-17T18:35:00.000Z",
    "details": {
      "stack": "Error: Name, email, and password are required.\n    at exports.register...",
      "originalError": null,
      "code": null
    }
  }
}
```

**Production Response**:

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Invalid request data. Please check your input and try again.",
    "timestamp": "2026-05-17T18:35:00.000Z"
  }
}
```

---

### 2. DUPLICATE_ERROR - Email Already Exists

**Endpoint**: `POST http://localhost:5000/api/auth/register`

**Request** (using existing email):

```json
{
  "name": "Jane Smith",
  "email": "john@example.com",
  "password": "password123"
}
```

**Development Response**:

```json
{
  "success": false,
  "error": {
    "type": "DUPLICATE_ERROR",
    "message": "An account with this email already exists.",
    "timestamp": "2026-05-17T18:36:00.000Z",
    "details": {
      "mongoError": "Duplicate key: email"
    }
  }
}
```

**Production Response**:

```json
{
  "success": false,
  "error": {
    "type": "DUPLICATE_ERROR",
    "message": "This resource already exists.",
    "timestamp": "2026-05-17T18:36:00.000Z"
  }
}
```

---

### 3. AUTHENTICATION_ERROR - Invalid Credentials

**Endpoint**: `POST http://localhost:5000/api/auth/login`

**Request** (wrong password):

```json
{
  "email": "john@example.com",
  "password": "wrongpassword"
}
```

**Development Response**:

```json
{
  "success": false,
  "error": {
    "type": "AUTHENTICATION_ERROR",
    "message": "Invalid email or password.",
    "timestamp": "2026-05-17T18:37:00.000Z"
  }
}
```

**Production Response**:

```json
{
  "success": false,
  "error": {
    "type": "AUTHENTICATION_ERROR",
    "message": "Authentication failed. Please log in and try again.",
    "timestamp": "2026-05-17T18:37:00.000Z"
  }
}
```

---

### 4. NOT_FOUND_ERROR - Resource Doesn't Exist

**Endpoint**: `GET http://localhost:5000/api/equipment/invalidid123`

**Development Response**:

```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND_ERROR",
    "message": "Equipment not found",
    "timestamp": "2026-05-17T18:38:00.000Z"
  }
}
```

**Production Response**:

```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND_ERROR",
    "message": "The requested resource was not found.",
    "timestamp": "2026-05-17T18:38:00.000Z"
  }
}
```

---

### 5. AUTHORIZATION_ERROR - Insufficient Permissions

**Endpoint**: `POST http://localhost:5000/api/auth/updateUserRole/userid123`

**Request** (as non-admin user):

```json
{
  "role": "Admin"
}
```

**Development Response**:

```json
{
  "success": false,
  "error": {
    "type": "AUTHORIZATION_ERROR",
    "message": "Access denied. Only admins can change user roles.",
    "timestamp": "2026-05-17T18:39:00.000Z"
  }
}
```

**Production Response**:

```json
{
  "success": false,
  "error": {
    "type": "AUTHORIZATION_ERROR",
    "message": "You do not have permission to perform this action.",
    "timestamp": "2026-05-17T18:39:00.000Z"
  }
}
```

---

### 6. SUCCESS - Equipment Created

**Endpoint**: `POST http://localhost:5000/api/equipment`

**Request**:

```json
{
  "name": "Hydraulic Press",
  "serialNumber": "HP-2026-001",
  "category": "Machinery",
  "location": "Factory Floor A"
}
```

**Success Response**:

```json
{
  "success": true,
  "message": "Equipment created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Hydraulic Press",
    "serialNumber": "HP-2026-001",
    "category": "Machinery",
    "location": "Factory Floor A",
    "status": "operational",
    "createdAt": "2026-05-17T18:40:00.000Z"
  }
}
```

---

## Using Postman/cURL for Testing

### Test with cURL

```bash
# VALIDATION_ERROR - Missing fields
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John"}'

# AUTHENTICATION_ERROR - Invalid credentials
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"wrong"}'

# NOT_FOUND_ERROR - Invalid ID
curl -X GET http://localhost:5000/api/equipment/invalidid

# SUCCESS - Valid request
curl -X GET http://localhost:5000/api/equipment
```

### Test with Postman

1. Open Postman
2. Create a new request
3. Set method and URL from examples above
4. Go to "Body" tab → select "raw" → set to "JSON"
5. Paste JSON from request examples
6. Click "Send"
7. Review response format

---

## Comparing Dev vs Prod Modes

### Development Mode Details

```bash
NODE_ENV=development npm run dev
```

Features:

- ✅ Full error message
- ✅ Stack trace included
- ✅ Validation error details
- ✅ MongoDB-specific error info
- ✅ Server-side logging with full context

**Response includes**:

```json
{
  "details": {
    "stack": "Error: ...\n    at ...",
    "originalError": null,
    "validationErrors": [{ "field": "email", "message": "..." }],
    "mongoError": "Duplicate key: email"
  }
}
```

### Production Mode Details

```bash
NODE_ENV=production npm run dev
```

Features:

- ✅ Generic error message
- ❌ No stack trace
- ❌ No validation details
- ❌ No sensitive information
- ✅ Server-side logging (essential info only)

**Response includes** only:

```json
{
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Invalid request data. Please check your input and try again.",
    "timestamp": "2026-05-17T18:35:00.000Z"
  }
}
```

---

## Monitoring Error Logs

### Server Console Output (Development)

```
[2026-05-17T18:35:00.000Z] warn: {
  message: "Name, email, and password are required.",
  statusCode: 400,
  path: "/api/auth/register",
  method: "POST",
  userId: "anonymous",
  stack: "Error: Name, email, and password are required.\n    at exports.register..."
}
```

### Server Console Output (Production)

```
[2026-05-17T18:35:00.000Z] warn: {
  message: "Name, email, and password are required.",
  statusCode: 400,
  path: "/api/auth/register",
  method: "POST",
  userId: "anonymous"
}
```

---

## Error Response Checklist

When testing, verify all responses include:

- [ ] `success: false` for errors, `success: true` for success
- [ ] `error.type` - One of the 7 error types
- [ ] `error.message` - Appropriate for environment
- [ ] `error.timestamp` - ISO format timestamp
- [ ] Correct HTTP status code (400, 401, 403, 404, 409, 500)
- [ ] Development: Stack trace in `error.details.stack`
- [ ] Production: No sensitive information leaked
- [ ] Server-side console logs show error with context

---

## Troubleshooting

### Response doesn't match expected format

1. Check `NODE_ENV` is set correctly
2. Verify errorMiddleware is imported in `server/index.js`
3. Confirm controller uses `asyncHandler` wrapper
4. Check that errors are being `throw`n (not `return`ed)

### Stack trace doesn't appear in development

1. Confirm `NODE_ENV=development` is set
2. Check response has `error.details` section
3. Verify error was thrown (not caught silently)
4. Look at browser dev console for the error

### Generic message in development mode

1. Check `NODE_ENV` variable: `echo $NODE_ENV`
2. Restart server after changing `NODE_ENV`
3. Check controller is using new error system
4. Clear browser cache and reload

---

## Integration with Frontend

The frontend can now parse consistent error responses:

```javascript
// Example: Handling error in React component
try {
  const response = await axiosInstance.post("/api/equipment", data);
  if (!response.data.success) {
    const errorType = response.data.error.type;
    const message = response.data.error.message;

    switch (errorType) {
      case "VALIDATION_ERROR":
        showFormErrors(response.data.error.details?.validationErrors);
        break;
      case "AUTHENTICATION_ERROR":
        redirectToLogin();
        break;
      case "AUTHORIZATION_ERROR":
        showAccessDenied();
        break;
      default:
        showError(message);
    }
  }
} catch (error) {
  console.error(error.response?.data);
}
```

---

## Next Steps

After verifying the error handling works:

1. ✅ Test all 7 error types
2. ✅ Verify dev vs prod differences
3. ✅ Check server-side logging
4. ✅ Update frontend error handling
5. ✅ Document API errors in Postman
6. ✅ Migrate remaining controllers

**This error handling system is production-ready and can be immediately deployed!**
