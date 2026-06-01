const express = require('express');
const request = require('supertest');
const notificationRoutes = require('../routes/notifications');
const notificationController = require('../controllers/notificationController');

// Mock auth middleware to pass through
jest.mock('../middleware/auth', () => ({
  verifyToken: (req, res, next) => next()
}));

// Mock controller methods
jest.mock('../controllers/notificationController', () => ({
  getNotifications: jest.fn((req, res) => res.status(200).send()),
  getUnreadCount: jest.fn((req, res) => res.status(200).send()),
  markAllAsRead: jest.fn((req, res) => res.status(200).send()),
  markAsRead: jest.fn((req, res) => res.status(200).send()),
  deleteNotification: jest.fn((req, res) => res.status(200).send())
}));

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);

describe('Notification Routes Method Mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should map PATCH /api/notifications/read-all to markAllAsRead controller', async () => {
    const res = await request(app).patch('/api/notifications/read-all');
    
    expect(res.status).toBe(200);
    expect(notificationController.markAllAsRead).toHaveBeenCalled();
  });

  it('should return 404 for PUT /api/notifications/read-all to prevent method regression', async () => {
    const res = await request(app).put('/api/notifications/read-all');
    
    // Express returns 404 for unsupported methods on a path
    expect(res.status).toBe(404);
    expect(notificationController.markAllAsRead).not.toHaveBeenCalled();
  });
});
