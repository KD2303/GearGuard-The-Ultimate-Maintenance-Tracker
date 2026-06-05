const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { authRateLimiters } = require('../middleware/rateLimiter');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  if (authRateLimiters.loginIpUserLimiter.delete) {
    await authRateLimiters.loginIpUserLimiter.delete('127.0.0.1_test@example.com').catch(()=> {});
    await authRateLimiters.loginIpLimiter.delete('127.0.0.1').catch(()=> {});
    await authRateLimiters.loginUserLimiter.delete('test@example.com').catch(()=> {});
  }
});

describe('Rate Limiting & Authentication', () => {
  it('should return identical error message for non-existent user to prevent enumeration', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'password123' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password.');
  });

  it('should return identical error message for existing user with wrong password', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = new User({ name: 'Test', email: 'test@example.com', password: hashedPassword, role: 'Technician' });
    await user.save();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password.');
  });

  it('should rate limit after multiple failed login attempts on same account', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = new User({ name: 'Test', email: 'test@example.com', password: hashedPassword, role: 'Technician' });
    await user.save();

    // 5 failures should be allowed (or 4 depending on setup, the limit is 5 so the 6th will block, or the 5th fails and 6th blocks before hitting controller)
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });
    }

    // Next request should hit 429
    const blockedRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(blockedRes.statusCode).toBe(429);
    expect(blockedRes.body.error).toMatch(/Too many authentication attempts/);
  });

  it('should return 423 if correct password but account is locked via DB', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = new User({ name: 'Locked User', email: 'locked@example.com', password: hashedPassword, role: 'Technician' });
    user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'locked@example.com', password: 'password123' });

    expect(res.statusCode).toBe(423);
    expect(res.body.error).toMatch(/Account temporarily locked/);
  });
});
