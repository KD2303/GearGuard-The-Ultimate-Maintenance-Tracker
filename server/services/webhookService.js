const Webhook = require('../models/Webhook');
const WebhookEvent = require('../models/WebhookEvent');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

const webhookQueue = new Queue('webhookQueue', { connection });

/**
 * Queue a webhook event for asynchronous dispatch.
 * 
 * @param {string} eventName - The event trigger (e.g., 'urgent_request')
 * @param {object} payload - The data payload to send
 */
exports.queueWebhookEvent = async (eventName, payload) => {
  try {
    // Find all active webhooks subscribed to this event
    const activeWebhooks = await Webhook.find({
      isActive: true,
      events: eventName
    });

    if (activeWebhooks.length === 0) {
      return; // No subscribers
    }

    // Prepare WebhookEvent documents for each subscriber
    const eventsToInsert = activeWebhooks.map(wh => ({
      webhookId: wh._id,
      provider: wh.provider,
      url: wh.url,
      payload,
      status: 'pending',
      attempts: 0,
      errorLog: []
    }));

    // Bulk insert into the MongoDB queue (acts as the DLQ / audit log)
    const insertedEvents = await WebhookEvent.insertMany(eventsToInsert);

    // Push jobs to BullMQ for robust processing
    for (const event of insertedEvents) {
      await webhookQueue.add('dispatchWebhook', {
        eventId: event._id,
        provider: event.provider,
        url: event.url,
        payload: event.payload
      }, {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000 // 1s, 2s, 4s, 8s, 16s
        },
        removeOnComplete: true,
        removeOnFail: true
      });
    }

    console.log(`[WebhookService] Queued ${insertedEvents.length} event(s) to BullMQ for trigger: ${eventName}`);
  } catch (error) {
    console.error('[WebhookService] Failed to queue webhook event:', error);
  }
};
