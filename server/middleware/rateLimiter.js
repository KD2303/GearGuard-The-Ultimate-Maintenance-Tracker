const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const { createClient } = require('redis');
const { triggerTripwire } = require('./threatIntel');

// Initialize Redis if REDIS_URL is present
let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL, socket: { tls: true } });
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.connect().catch(console.error);
}

// Factory to create limiters that automatically fall back to memory
const createLimiter = (keyPrefix, points, duration) => {
  if (redisClient) {
    return new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix,
      points,
      duration,
    });
  }
  return new RateLimiterMemory({
    keyPrefix,
    points,
    duration,
  });
};

const getLimit = (prodLimit) => {
  if (process.env.BYPASS_RATE_LIMIT === 'true') {
    return 100000;
  }
  return prodLimit;
};

// 1. Global Limiter: 200 requests per IP per 15 minutes
const globalRateLimiter = createLimiter('global', getLimit(200), 15 * 60);

const globalLimiter = async (req, res, next) => {
  try {
    await globalRateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    // Trigger tripwire for global burst rate limit exceeded
    triggerTripwire(req, 'RATE_LIMIT_BURST_GLOBAL');
    res.status(429).json({ error: 'Too many requests from this IP. Please try again after 15 minutes.' });
  }
};

// 2. Auth Limiter (Replaces old authLimiter)
// We will use 3 specialized limiters for auth to protect against brute force

// 20 fails per IP per hour
const loginIpLimiter = createLimiter('login_fail_ip', getLimit(20), 60 * 60);
// 5 fails per IP+Email per 15 mins
const loginIpUserLimiter = createLimiter('login_fail_ip_user', getLimit(5), 15 * 60);
// 10 fails per Email globally per 24 hours
const loginUserLimiter = createLimiter('login_fail_user', getLimit(10), 24 * 60 * 60);

// Unified login limiter middleware
const authLimiter = async (req, res, next) => {
  const email = req.body.email ? req.body.email.toLowerCase().trim() : 'unknown';
  const ip = req.ip;

  try {
    // Check all limiters, don't consume yet. Consume happens on failure in the controller.
    // However, for generic auth spam, we should at least consume the IP limiter for *attempts*?
    // Usually, we consume on attempt for IP, and consume on failure for the stricter ones.
    
    // For simplicity, we just check if they are blocked:
    const [resIp, resIpUser, resUser] = await Promise.all([
      loginIpLimiter.get(ip),
      loginIpUserLimiter.get(`${ip}_${email}`),
      loginUserLimiter.get(email)
    ]);

    let retrySecs = 0;
    let maxConsumed = 0;
    if (resIp !== null && resIp.consumedPoints >= loginIpLimiter.points) {
      retrySecs = Math.max(retrySecs, Math.round(resIp.msBeforeNext / 1000) || 1);
      maxConsumed = Math.max(maxConsumed, resIp.consumedPoints);
    }
    if (resIpUser !== null && resIpUser.consumedPoints >= loginIpUserLimiter.points) {
      retrySecs = Math.max(retrySecs, Math.round(resIpUser.msBeforeNext / 1000) || 1);
      maxConsumed = Math.max(maxConsumed, resIpUser.consumedPoints);
    }
    if (resUser !== null && resUser.consumedPoints >= loginUserLimiter.points) {
      retrySecs = Math.max(retrySecs, Math.round(resUser.msBeforeNext / 1000) || 1);
      maxConsumed = Math.max(maxConsumed, resUser.consumedPoints);
    }

    if (retrySecs > 0) {
      // Trigger tripwire on auth burst limit
      triggerTripwire(req, 'RATE_LIMIT_BURST_AUTH');
      
      // Progressive Tarpitting
      // Delay exponentially based on how many points over the limit they are, max 10 seconds
      const delayMs = Math.min(Math.pow(2, maxConsumed - loginIpLimiter.points) * 1000, 10000);
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      res.set('Retry-After', String(retrySecs));
      return res.status(429).json({ error: 'Too many authentication attempts. Please try again later.' });
    }

    next();
  } catch (err) {
    next();
  }
};

// Expose limits for the controller to consume on failure
const authRateLimiters = {
  loginIpLimiter,
  loginIpUserLimiter,
  loginUserLimiter
};

// 3. Register Limiter: 5 registrations per IP per hour
const registerRateLimiter = createLimiter('register', 5, 60 * 60);

const registerLimiter = async (req, res, next) => {
  try {
    await registerRateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    triggerTripwire(req, 'RATE_LIMIT_BURST_REGISTER');
    res.status(429).json({ error: 'Too many accounts created from this IP. Please try again after 1 hour.' });
  }
};

module.exports = { globalLimiter, authLimiter, registerLimiter, authRateLimiters };
