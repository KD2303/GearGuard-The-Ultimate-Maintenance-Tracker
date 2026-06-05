/**
 * CSRF defense-in-depth via Origin and Referer validation.
 *
 * Context for this codebase:
 * - Business endpoints authenticate with a Bearer token in the Authorization
 *   header. Browsers never attach that header automatically and a cross-site
 *   page cannot set it, so those endpoints are not exposed to classic CSRF.
 * - The only credential cookie, gearguard_refresh_token, is already HttpOnly
 *   and SameSite=Strict, which blocks cross-site submission.
 *
 * This middleware adds an explicit, auditable layer recommended by the OWASP
 * CSRF Prevention Cheat Sheet for token-based APIs: validate the Origin (or
 * Referer as a fallback) on state-changing requests against an allowlist.
 *
 * It is intentionally non-breaking:
 * - Safe methods (GET, HEAD, OPTIONS) are never checked.
 * - Requests with no Origin and no Referer are allowed. Native mobile clients,
 *   server-to-server callers and tools such as curl do not send these headers
 *   and rely on Bearer tokens, which are not CSRF-reachable.
 * - Only a request that presents a browser Origin or Referer NOT on the
 *   allowlist is rejected, since that is the signature of a cross-site attack.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function buildAllowedOrigins() {
  const origins = new Set();

  if (process.env.FRONTEND_URL) origins.add(process.env.FRONTEND_URL);
  if (process.env.CLIENT_URL) origins.add(process.env.CLIENT_URL);

  // Local development origins for the Vite and CRA dev servers.
  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:5173');
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:5173');
    origins.add('http://127.0.0.1:3000');
  }

  return origins;
}

const allowedOrigins = buildAllowedOrigins();

function normalizeToOrigin(value) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

const csrfProtection = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer || req.headers.referrer;

  // No browser-supplied source header. Non-browser clients (mobile, curl,
  // service-to-service) authenticate with Bearer tokens and are not reachable
  // by CSRF, so allow the request to proceed to the auth layer.
  if (!origin && !referer) {
    return next();
  }

  const candidate = origin || normalizeToOrigin(referer);

  if (candidate && allowedOrigins.has(candidate)) {
    return next();
  }

  console.warn(`[CSRF] Blocked ${req.method} ${req.originalUrl} from origin "${candidate || referer}"`);

  return res.status(403).json({
    success: false,
    error: {
      type: 'CSRF_VALIDATION_ERROR',
      message: 'Request origin is not allowed.',
      timestamp: new Date().toISOString(),
    },
  });
};

module.exports = {
  csrfProtection,
  allowedOrigins,
};
