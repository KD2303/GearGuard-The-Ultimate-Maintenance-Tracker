const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');

describe('Search API', () => {
  jest.setTimeout(30000);

  let mongoServer;
  beforeAll(async () => {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  it('should truncate extremely long search queries', async () => {
    const longQuery = 'a'.repeat(200);
    const res = await request(app).get(`/api/v1/search?q=${longQuery}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.equipment)).toBe(true);
    expect(Array.isArray(res.body.requests)).toBe(true);
  });

  it('should escape regex control characters safely', async () => {
    const maliciousQuery = '.*+?^${}()|[]\\';
    const res = await request(app).get(`/api/v1/search?q=${encodeURIComponent(maliciousQuery)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.equipment)).toBe(true);
    expect(Array.isArray(res.body.requests)).toBe(true);
  });
});
