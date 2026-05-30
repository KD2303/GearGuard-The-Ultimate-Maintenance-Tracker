const { Webhook } = require('../models');
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

    if (provider === 'Slack') {
      payload = { text: messageText };
    } else if (provider === 'Discord') {
      payload = { content: messageText };
    } else if (provider === 'Teams') {
      payload = { text: messageText };
    }

    await axios.post(url, payload, { timeout: 5000 });

    res.status(200).json({ success: true, message: 'Test webhook sent successfully' });
  } catch (error) {
    console.error('Webhook test failed:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send test webhook', 
      details: error.message 
    });
  }
};
