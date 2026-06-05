/**
 * Retry an asynchronous operation with exponential backoff.
 *
 * Built for transient failures such as a briefly unavailable SMTP service,
 * where a short series of spaced retries recovers without losing the work.
 * Pure in-process implementation, so it adds no infrastructure dependency.
 *
 * @param {Function} operation - async function to attempt; receives the 1-based attempt number
 * @param {Object}   [options]
 * @param {number}   [options.maxAttempts=4]  total attempts including the first
 * @param {number}   [options.baseDelayMs=500] delay before the first retry; doubles each time
 * @param {number}   [options.maxDelayMs=8000] upper bound on any single delay
 * @param {Function} [options.onRetry] called as (error, attempt, delayMs) before each wait
 * @returns {Promise<*>} resolves with the operation result, or rejects with the last error
 */
async function retryWithBackoff(operation, options = {}) {
  const {
    maxAttempts = 4,
    baseDelayMs = 500,
    maxDelayMs = 8000,
    onRetry,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;

      // No attempts left: surface the failure to the caller.
      if (attempt >= maxAttempts) {
        break;
      }

      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);

      if (typeof onRetry === 'function') {
        onRetry(error, attempt, delay);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

module.exports = { retryWithBackoff };
