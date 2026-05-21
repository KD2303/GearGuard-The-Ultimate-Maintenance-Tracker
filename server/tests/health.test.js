const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server/index');

describe('Health Check API', () => {
  beforeAll(async () => {
    // Optionally connect to an in-memory database if needed for test
    // For health check, it will just show Disconnected if not connected
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should return health status', async () => {
    const res = await request(app).get('/api/health');
    
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('status');
    expect(['OK', 'ERROR']).toContain(res.body.status);
    expect(res.body).toHaveProperty('message', 'GearGuard API health status');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('timestamp');
  });
});
