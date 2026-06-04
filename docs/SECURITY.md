# Security Architecture

## Authentication Flow

GearGuard uses a robust authentication mechanism combining short-lived Access Tokens with long-lived, rotating Refresh Tokens stored securely in cookies.

### Tokens
1. **Access Token (AT)**: 
   - JWT containing `userId` and `role`.
   - Lifespan: 15 minutes.
   - Delivered in the JSON response payload.
   - Stored in memory / `localStorage` on the frontend.
2. **Refresh Token (RT)**:
   - Cryptographically secure random string.
   - Lifespan: 7 days.
   - Delivered via `HttpOnly`, `Secure`, `SameSite=Strict` cookie (`gearguard_refresh_token`).
   - Resistant to Cross-Site Scripting (XSS) attacks.

### Session Tracking & Reuse Detection
When a user logs in, a `Session` record is created in the database.
- **Rotation**: Every time an Access Token expires, the frontend automatically calls `/api/auth/refresh` using the RT cookie. The server validates the RT against the `Session` record, generates a **new** RT, stores the hash of the new RT, and returns it.
- **Reuse Detection**: If an attacker steals a Refresh Token and attempts to use it *after* the legitimate user has already refreshed it (or vice versa), the server detects that the token hash matches a previously used token (`usedTokenHashes`).
- **Compromise Mitigation**: Upon detecting token reuse, the server instantly invalidates the entire `Session` chain, forcing the user to log in again, thereby neutralizing the stolen token.

### Session Management
- **Logout**: Invalidates the current `Session` record in the database and clears the HttpOnly cookie.
- **Logout All**: Invalidates all `Session` records associated with the user across all devices.

## Role-Based Access Control (RBAC)
User roles (`Admin`, `Manager`, `Technician`) are strictly enforced in both the UI and API endpoints. Role assignments are protected and can only be modified by Admins.
