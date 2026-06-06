const Redis = require('ioredis');

// Use the existing REDIS_URL from environment or fallback to localhost
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl);

const FAILURE_THRESHOLD = 10;
const OPEN_CIRCUIT_TTL = 15 * 60; // 15 minutes in seconds

class CircuitBreaker {
  /**
   * Check if the circuit is open for a specific URL.
   * @param {string} url - The URL to check
   * @returns {boolean} True if the circuit is open and requests should be blocked
   */
  async isOpen(url) {
    const isOpen = await redis.get(`circuit:${url}:open`);
    return isOpen === 'true';
  }

  /**
   * Record a failure for a specific URL. 
   * If failures reach the threshold, it opens the circuit.
   * @param {string} url - The URL that failed
   */
  async recordFailure(url) {
    const key = `circuit:${url}:failures`;
    const failures = await redis.incr(key);
    
    // Set expiry to reset failures if they are sporadic (e.g. 5 mins)
    if (failures === 1) {
      await redis.expire(key, 5 * 60);
    }

    if (failures >= FAILURE_THRESHOLD) {
      console.warn(`[CircuitBreaker] Threshold reached for ${url}. Opening circuit for 15 minutes.`);
      await redis.setex(`circuit:${url}:open`, OPEN_CIRCUIT_TTL, 'true');
      await redis.del(key); // Reset counter
    }
  }

  /**
   * Record a success, which resets the failure counter.
   * @param {string} url - The URL that succeeded
   */
  async recordSuccess(url) {
    await redis.del(`circuit:${url}:failures`);
  }
}

module.exports = new CircuitBreaker();
