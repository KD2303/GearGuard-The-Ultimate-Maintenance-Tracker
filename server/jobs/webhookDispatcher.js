const axios = require('axios');
const WebhookEvent = require('../models/WebhookEvent');
const { retryWithBackoff } = require('../utils/retryWithBackoff');

class WebhookDispatcher {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.POLL_INTERVAL_MS = 5000; // Poll every 5 seconds
    this.BATCH_SIZE = 20; // Process 20 events per tick
  }

  start() {
    if (this.intervalId) return;
    console.log('[WebhookDispatcher] Starting queue polling...');
    this.intervalId = setInterval(() => this.processQueue(), this.POLL_INTERVAL_MS);
    
    // Initial run
    this.processQueue();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[WebhookDispatcher] Stopped queue polling.');
    }
  }

  async processQueue() {
    if (this.isRunning) return; // Prevent overlapping ticks
    this.isRunning = true;

    try {
      // Find up to BATCH_SIZE pending events
      const events = await WebhookEvent.find({ status: 'pending' })
        .sort({ createdAt: 1 })
        .limit(this.BATCH_SIZE);

      if (events.length === 0) {
        this.isRunning = false;
        return;
      }

      console.log(`[WebhookDispatcher] Processing ${events.length} event(s)...`);

      // We use Promise.allSettled to process them concurrently but handle individually
      await Promise.allSettled(events.map(event => this.dispatchWithRetry(event)));

    } catch (error) {
      console.error('[WebhookDispatcher] Error during queue processing tick:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async dispatchWithRetry(event) {
    // 1. Mark as processing
    event.status = 'processing';
    await event.save();

    let attemptsMade = 0;

    try {
      // 2. Dispatch using resilient backoff utility
      await retryWithBackoff(async (attempt) => {
        attemptsMade = attempt;
        
        let formattedPayload = {};
        
        // Format payload based on provider
        if (event.provider === 'Slack' || event.provider === 'Teams') {
          formattedPayload = { text: JSON.stringify(event.payload, null, 2) };
        } else if (event.provider === 'Discord') {
          formattedPayload = { content: JSON.stringify(event.payload, null, 2) };
        } else {
          formattedPayload = event.payload; // fallback
        }

        const response = await axios.post(event.url, formattedPayload, { timeout: 10000 });
        return response.data;
      }, {
        maxAttempts: 4, // 4 attempts max
        baseDelayMs: 1000, // starting with 1s
        maxDelayMs: 15000, // up to 15s
        onRetry: (error, attempt, delay) => {
          console.warn(`[WebhookDispatcher] Event ${event._id} attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
          event.errorLog.push(`Attempt ${attempt}: ${error.message}`);
        }
      });

      // 3. Mark completed if successful
      event.status = 'completed';
      event.attempts = attemptsMade;
      await event.save();
      console.log(`[WebhookDispatcher] Event ${event._id} successfully dispatched.`);

    } catch (finalError) {
      // 4. Mark as failed (Dead Letter Queue) after all retries exhausted
      console.error(`[WebhookDispatcher] Event ${event._id} failed permanently:`, finalError.message);
      event.status = 'failed';
      event.attempts = attemptsMade;
      event.errorLog.push(`Final Failure: ${finalError.message}`);
      await event.save();
    }
  }
}

// Singleton instance
const dispatcher = new WebhookDispatcher();

module.exports = dispatcher;
