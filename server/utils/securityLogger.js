const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
const logFile = path.join(logDir, 'security.log');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Log a security violation or threat intelligence event
 * @param {Object} req - The Express request object
 * @param {String} violationType - The type of violation (e.g. ANOMALY_MISSING_UA, RATE_LIMIT_BURST, CSRF_VIOLATION)
 * @param {String} details - Additional contextual details
 */
const logSecurityEvent = (req, violationType, details = '') => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'missing';
  
  const payloadSnippet = req.body 
    ? JSON.stringify(req.body).substring(0, 200) 
    : '';

  const logEntry = {
    timestamp,
    ip,
    method: req.method,
    url: req.originalUrl || req.url,
    violationType,
    details,
    userAgent,
    payloadSnippet,
    userId: req.user?.id || 'unauthenticated'
  };

  const logString = JSON.stringify(logEntry) + '\n';
  
  // Non-blocking file write
  fs.appendFile(logFile, logString, (err) => {
    if (err) console.error('[Security Logger] Failed to write log:', err);
  });

  // Emit to admins if socketio is available
  if (req.app) {
    const io = req.app.get('socketio');
    if (io) {
      // Broadcast to any users connected to their personal rooms if they are admins?
      // Our existing pattern has users joining `user:${userId}`. Wait, is there an `admin` room?
      // Currently, admins don't explicitly join an "admin" room in server/index.js unless they do it on the client.
      // But we can just emit to 'security_anomaly_detected' globally, and let the client filter if needed, 
      // or we just emit it and rely on the UI. For security, we emit it to a namespace or event.
      io.emit('security_anomaly_detected', logEntry);
    }
  }

  // Also log to console for development visibility
  console.warn(`[SECURITY TRIPWIRE] ${violationType} from IP: ${ip} on ${req.method} ${req.originalUrl}`);
};

module.exports = {
  logSecurityEvent
};
