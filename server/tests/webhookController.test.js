const webhookController = require('../controllers/webhookController');
const { Webhook, WebhookEvent } = require('../models');
const axios = require('axios');

jest.mock('../models', () => ({
  Webhook: {
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
  },
  WebhookEvent: {
    create: jest.fn()
  }
}));
jest.mock('axios');

describe('Webhook Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getWebhooks', () => {
    it('should return all webhooks', async () => {
      const mockWebhooks = [{ _id: '1', url: 'http://test.com', provider: 'Slack' }];
      Webhook.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockWebhooks)
      });

      await webhookController.getWebhooks(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockWebhooks });
    });

    it('should handle errors', async () => {
      Webhook.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('DB Error'))
      });

      await webhookController.getWebhooks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Server Error fetching webhooks' });
    });
  });

  describe('createWebhook', () => {
    it('should create a new webhook', async () => {
      req.body = { url: 'http://test.com', provider: 'Slack' };
      const mockWebhook = { _id: '1', ...req.body };
      Webhook.create.mockResolvedValue(mockWebhook);

      await webhookController.createWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockWebhook });
    });

    it('should handle validation errors', async () => {
      const validationError = new Error();
      validationError.name = 'ValidationError';
      validationError.errors = { url: { message: 'Invalid URL' } };
      Webhook.create.mockRejectedValue(validationError);

      await webhookController.createWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Invalid URL' });
    });
  });

  describe('updateWebhook', () => {
    it('should update an existing webhook', async () => {
      req.params.id = '1';
      req.body = { isActive: false };
      const mockWebhook = { _id: '1', isActive: false };
      Webhook.findByIdAndUpdate.mockResolvedValue(mockWebhook);

      await webhookController.updateWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockWebhook });
    });

    it('should return 404 if webhook not found', async () => {
      req.params.id = '1';
      Webhook.findByIdAndUpdate.mockResolvedValue(null);

      await webhookController.updateWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Webhook not found' });
    });
  });

  describe('deleteWebhook', () => {
    it('should delete an existing webhook', async () => {
      req.params.id = '1';
      Webhook.findByIdAndDelete.mockResolvedValue({ _id: '1' });

      await webhookController.deleteWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: {} });
    });

    it('should return 404 if webhook not found', async () => {
      req.params.id = '1';
      Webhook.findByIdAndDelete.mockResolvedValue(null);

      await webhookController.deleteWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Webhook not found' });
    });
  });

  describe('testWebhook', () => {
    it('should queue a test payload via WebhookEvent', async () => {
      req.body = { url: 'http://test.com', provider: 'Slack' };
      const newWebhookEvent = { _id: 'event-1' };
      WebhookEvent.create.mockResolvedValue(newWebhookEvent);

      await webhookController.testWebhook(req, res);

      expect(WebhookEvent.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Test webhook queued successfully via dispatcher', data: newWebhookEvent });
    });

    it('should return 400 if url or provider is missing', async () => {
      req.body = { url: 'http://test.com' }; // missing provider

      await webhookController.testWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'URL and provider are required to test' });
    });
  });
});
