const Redis = require('ioredis');
const Redlock = require('redlock').default; // redlock v5 default export

// Ensure we fall back to localhost if REDIS_URL is not provided
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = new Redis(redisUrl);

redisClient.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

// Configure Redlock
const redlock = new Redlock(
  [redisClient],
  {
    driftFactor: 0.01,
    retryCount: 10,
    retryDelay: 200,
    retryJitter: 200,
    automaticExtensionThreshold: 500, // extend lock before it expires
  }
);

redlock.on('error', (err) => {
  console.error('[Redlock] Error:', err.message);
});

module.exports = {
  redisClient,
  redlock
};
