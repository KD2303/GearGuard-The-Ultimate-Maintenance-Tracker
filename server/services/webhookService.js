const Webhook = require('../models/Webhook');
const WebhookEvent = require('../models/WebhookEvent');

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

    // Bulk insert into the queue
    await WebhookEvent.insertMany(eventsToInsert);
    console.log(`[WebhookService] Queued ${eventsToInsert.length} event(s) for trigger: ${eventName}`);
  } catch (error) {
    console.error('[WebhookService] Failed to queue webhook event:', error);
  }
};
