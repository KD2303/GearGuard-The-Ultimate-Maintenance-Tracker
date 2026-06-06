const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const { createClient } = require('redis');
const { logSecurityEvent } = require('../utils/securityLogger');

let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL, socket: { tls: true } });
  redisClient.on('error', (err) => console.error('Redis Client Error in ThreatIntel', err));
  redisClient.connect().catch(console.error);
}

// Config: 5 tripwires within 5 minutes results in a 15-minute ban (900 seconds)
const TRIPWIRE_POINTS = 5;
const TRIPWIRE_DURATION = 300; // 5 minutes
const BLOCK_DURATION = 900; // 15 minutes

const tripwireConfig = {
  keyPrefix: 'ips_tripwire',
  points: TRIPWIRE_POINTS,
  duration: TRIPWIRE_DURATION,
  blockDuration: BLOCK_DURATION
};

const tripwireLimiter = redisClient
  ? new RateLimiterRedis({ ...tripwireConfig, storeClient: redisClient })
  : new RateLimiterMemory(tripwireConfig);

/**
 * Increment the tripwire counter for a given IP.
 * @param {Object} req - The Express request object
 * @param {String} reason - The violation reason string
 */
const triggerTripwire = async (req, reason) => {
  if (process.env.BYPASS_RATE_LIMIT === 'true') return;

  try {
    const res = await tripwireLimiter.consume(req.ip);
    logSecurityEvent(req, reason, `Tripwire triggered. Points consumed: ${res.consumedPoints}/${TRIPWIRE_POINTS}`);
  } catch (rejRes) {
    // If consume throws, it means the limit is reached and IP is now blocked.
    // rejRes could be the RateLimiterRes object
    const isFirstBlock = rejRes.consumedPoints === TRIPWIRE_POINTS + 1; // Or depends on how it's consumed
    if (isFirstBlock || !rejRes.consumedPoints) {
      logSecurityEvent(req, 'AUTO_BAN_TRIGGERED', `IP automatically banned for ${BLOCK_DURATION / 60} minutes due to: ${reason}`);
    }
  }
};

/**
 * Middleware: Checks if IP is currently banned, and performs basic heuristic anomaly detection.
 */
const threatIntelligence = async (req, res, next) => {
  if (process.env.BYPASS_RATE_LIMIT === 'true') {
    return next();
  }

  const ip = req.ip;

  try {
    // 1. Check if IP is currently blocked
    const resLimiter = await tripwireLimiter.get(ip);
    if (resLimiter !== null && resLimiter.consumedPoints > TRIPWIRE_POINTS) {
      // Banned
      const retrySecs = Math.round(resLimiter.msBeforeNext / 1000) || 1;
      res.set('Retry-After', String(retrySecs));
      return res.status(403).json({
        success: false,
        error: {
          type: 'SECURITY_BAN_ACTIVE',
          message: 'Connection dropped due to multiple security violations.',
          retryAfter: retrySecs
        }
      });
    }

    // 2. Heuristics Anomaly Detection
    const userAgent = req.get('User-Agent');
    
    // Anomaly: Missing User-Agent
    if (!userAgent || userAgent.trim() === '') {
      await triggerTripwire(req, 'ANOMALY_MISSING_UA');
      return res.status(403).json({ error: 'Forbidden: Invalid Request Signature' });
    }

    // Could add more heuristics here, e.g., suspicious Accept headers, specific known malicious strings.

    next();
  } catch (err) {
    // Fail open in case of Redis/Memory error
    console.error('ThreatIntel Error:', err);
    next();
  }
};

module.exports = {
  threatIntelligence,
  triggerTripwire
};
