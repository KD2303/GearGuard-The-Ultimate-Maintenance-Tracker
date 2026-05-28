const rateLimit = require('express-rate-limit');

// Layer 1 — Applied to ALL routes
// Allows 200 requests per IP per 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 100000,
  message: {
    error: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Layer 2 — Applied ONLY to /api/auth/login and /api/auth/register
// Allows only 10 attempts per IP per 15 minutes
// Successful requests do not count toward the limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100000,
  message: {
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Layer 2b — Applied to /api/auth/register separately
// Stricter — only 5 registrations per IP per hour
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many accounts created from this IP. Please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { globalLimiter, authLimiter, registerLimiter };
