const { Webhook, WebhookEvent } = require('../models');
const { queueWebhookEvent } = require('../services/webhookService');
const axios = require('axios');

exports.getWebhooks = async (req, res) => {
  try {
    const webhooks = await Webhook.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: webhooks });
  } catch (error) {
    console.error('Failed to get webhooks:', error);
    res.status(500).json({ success: false, error: 'Server Error fetching webhooks' });
  }
};

exports.createWebhook = async (req, res) => {
  try {
    const { url, provider, isActive, events } = req.body;
    
    const newWebhook = await Webhook.create({
      url,
      provider,
      isActive,
      events
    });

    res.status(201).json({ success: true, data: newWebhook });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    console.error('Failed to create webhook:', error);
    res.status(500).json({ success: false, error: 'Server Error creating webhook' });
  }
};

exports.updateWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const webhook = await Webhook.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    res.status(200).json({ success: true, data: webhook });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    console.error('Failed to update webhook:', error);
    res.status(500).json({ success: false, error: 'Server Error updating webhook' });
  }
};

exports.deleteWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const webhook = await Webhook.findByIdAndDelete(id);

    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Failed to delete webhook:', error);
    res.status(500).json({ success: false, error: 'Server Error deleting webhook' });
  }
};

exports.testWebhook = async (req, res) => {
  try {
    const { url, provider } = req.body;
    if (!url || !provider) {
      return res.status(400).json({ success: false, error: 'URL and provider are required to test' });
    }

    let payload = {};
    const messageText = '🚨 *Test Alert*: This is a test message from GearGuard Webhook Integration Engine.';

    if (provider === 'Slack' || provider === 'Teams') {
      payload = { text: messageText };
    } else if (provider === 'Discord') {
      payload = { content: messageText };
    }

    // Rather than directly posting, let's use the new queue to test the dispatcher!
    // We pass 'test_event' to explicitly queue it just for this webhook.
    const newWebhookEvent = await WebhookEvent.create({
      webhookId: null, // Test event, no active subscriber needed
      provider,
      url,
      payload,
      status: 'pending',
      attempts: 0,
      errorLog: []
    });

    res.status(200).json({ success: true, message: 'Test webhook queued successfully via dispatcher', data: newWebhookEvent });
  } catch (error) {
    console.error('Webhook test failed:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send test webhook', 
      details: error.message 
    });
  }
};

exports.getDlq = async (req, res) => {
  try {
    const failedEvents = await WebhookEvent.find({ status: 'failed' }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: failedEvents });
  } catch (error) {
    console.error('Failed to get DLQ:', error);
    res.status(500).json({ success: false, error: 'Server Error fetching DLQ' });
  }
};

exports.replayDlqEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await WebhookEvent.findById(id);

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    if (event.status !== 'failed') {
      return res.status(400).json({ success: false, error: 'Only failed events can be replayed' });
    }

    event.status = 'pending';
    event.attempts = 0;
    event.errorLog = [];
    await event.save();

    res.status(200).json({ success: true, message: 'Event requeued successfully', data: event });
  } catch (error) {
    console.error('Failed to replay event:', error);
    res.status(500).json({ success: false, error: 'Server Error replaying event' });
  }
};
