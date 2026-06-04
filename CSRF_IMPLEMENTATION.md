# CSRF Protection Implementation Guide

## Overview

GearGuard now includes comprehensive CSRF (Cross-Site Request Forgery) protection on all state-mutating endpoints (POST, PUT, DELETE).

## How It Works

1. **Client-side**: Fetch CSRF token from `/api/v1/csrf-token`
2. **Request-side**: Include token in `X-CSRF-Token` header for all state-mutating requests
3. **Server-side**: Validates token before processing the request

## Client Implementation

```javascript
// Initialize CSRF token on app load
let csrfToken = '';

async function initCSRF() {
  const response = await fetch('/api/v1/csrf-token');
  const data = await response.json();
  csrfToken = data.csrfToken;
}

// Example: Creating maintenance request
async function createMaintenance(data) {
  const response = await fetch('/api/v1/maintenance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,  // CRITICAL: Include token
    },
    body: JSON.stringify(data),
  });
  return response.json();
}
```

## Protected Endpoints

All state-mutating operations require CSRF token:
- POST /api/v1/maintenance
- PUT /api/v1/maintenance/:id
- DELETE /api/v1/maintenance/:id
- POST /api/v1/equipment
- PUT /api/v1/equipment/:id
- DELETE /api/v1/equipment/:id
- POST /api/v1/work-orders
- DELETE /api/v1/work-orders/:id
- And all other state-mutating endpoints

## Token Refresh

CSRF tokens expire based on session expiry (1 hour default). If a request fails with 403 CSRF error:
1. Fetch a new token from `/api/v1/csrf-token`
2. Retry the request with the new token

## Security Features

- HttpOnly cookies (cannot be accessed via JavaScript)
- SameSite=Strict (browser prevents cross-origin submission)
- Session-based token (tied to user session)
- Automatic token validation on all state-mutating requests
