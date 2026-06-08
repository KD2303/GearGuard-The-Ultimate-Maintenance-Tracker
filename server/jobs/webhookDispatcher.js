const axios = require('axios');
const http = require('http');
const https = require('https');
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const WebhookEvent = require('../models/WebhookEvent');
const circuitBreaker = require('../utils/circuitBreaker');

// Configure keep-alive agents to prevent Socket Exhaustion during High-Volume Event Storms
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 100 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 100 });

const keepAliveAxios = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 10000
});

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

class WebhookDispatcher {
  constructor() {
    this.worker = null;
  }

  start() {
    if (this.worker) return;
    console.log('[WebhookDispatcher] Starting BullMQ worker...');

    this.worker = new Worker('webhookQueue', async job => {
      const { eventId, url, provider, payload } = job.data;

      // 1. Mark as processing in MongoDB
      await WebhookEvent.findByIdAndUpdate(eventId, { status: 'processing', attempts: job.attemptsMade + 1 });

      // 2. Check Circuit Breaker
      if (await circuitBreaker.isOpen(url)) {
        const errorMsg = `Circuit is open for ${url}. Bouncing request.`;
        console.warn(`[WebhookDispatcher] ${errorMsg}`);
        await WebhookEvent.findByIdAndUpdate(eventId, {
          $push: { errorLog: `Attempt ${job.attemptsMade + 1}: ${errorMsg}` }
        });
        throw new Error(errorMsg); // Throws so BullMQ retries (exponential backoff)
      }

      // 3. Format payload
      let formattedPayload = {};
      if (provider === 'Slack' || provider === 'Teams') {
        formattedPayload = { text: JSON.stringify(payload, null, 2) };
      } else if (provider === 'Discord') {
        formattedPayload = { content: JSON.stringify(payload, null, 2) };
      } else {
        formattedPayload = payload;
      }

      // 4. Attempt the HTTP request
      try {
        const response = await keepAliveAxios.post(url, formattedPayload);
        
        // Success
        await circuitBreaker.recordSuccess(url);
        await WebhookEvent.findByIdAndUpdate(eventId, { status: 'completed', attempts: job.attemptsMade + 1 });
        console.log(`[WebhookDispatcher] Event ${eventId} successfully dispatched.`);
        
        return response.data;
      } catch (error) {
        // Failure
        await circuitBreaker.recordFailure(url);
        await WebhookEvent.findByIdAndUpdate(eventId, {
          $push: { errorLog: `Attempt ${job.attemptsMade + 1}: ${error.message}` }
        });
        throw error; // Throw so BullMQ can handle the retry logic natively
      }
    }, { connection, concurrency: 5 }); // Process up to 5 webhooks concurrently

    this.worker.on('failed', async (job, err) => {
      // If it has exhausted all 5 attempts natively, BullMQ emits 'failed' without 'retrying'
      // We check if it's the final failure
      if (job.attemptsMade >= job.opts.attempts) {
        console.error(`[WebhookDispatcher] Event ${job.data.eventId} failed permanently:`, err.message);
        await WebhookEvent.findByIdAndUpdate(job.data.eventId, { status: 'failed', attempts: job.attemptsMade });
      }
    });

    this.worker.on('error', err => {
      console.error('[WebhookDispatcher] BullMQ Worker Error:', err);
    });
  }

  stop() {
    if (this.worker) {
      this.worker.close();
      this.worker = null;
      console.log('[WebhookDispatcher] Stopped BullMQ worker.');
    }
  }
}

// Singleton instance
const dispatcher = new WebhookDispatcher();

module.exports = dispatcher;
