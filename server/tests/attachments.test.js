const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const app = require('../index');
const { MaintenanceRequest, Equipment } = require('../models');
const User = require('../models/user');

describe('Attachments API', () => {
  jest.setTimeout(30000);
  let token;
  let adminToken;
  let user;
  let adminUser;
  let reqId;

  let mongoServer;
  beforeAll(async () => {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // Connect DB handled by your test setup or we can ensure it here
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri);
    }

    user = await User.create({
      name: 'Test Tech',
      email: 'tech_attach@test.com',
      password: 'password123',
      role: 'Technician',
    });

    adminUser = await User.create({
      name: 'Test Admin',
      email: 'admin_attach@test.com',
      password: 'password123',
      role: 'Admin',
    });

    // Mock token generation (replace with your actual token generation logic or login route)
    const jwt = require('jsonwebtoken');
    token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET);

    const eq = await Equipment.create({ 
      name: 'Pump', 
      serialNumber: 'PUMP-1', 
      status: 'active',
      category: 'pump',
      location: 'factory'
    });
    
    const newReq = await MaintenanceRequest.create({
      subject: 'Test attach',
      type: 'corrective',
      priority: 'low',
      equipmentId: eq._id,
      createdById: user._id,
      requestNumber: 'REQ-999999-9999'
    });
    reqId = newReq._id.toString();
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['tech_attach@test.com', 'admin_attach@test.com', 'other_tech@test.com'] } });
    await MaintenanceRequest.deleteMany({ requestNumber: 'REQ-999999-9999' });
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('should upload an attachment successfully if authorized', async () => {
    const testFilePath = path.join(__dirname, 'testfile.png');
    const validPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    fs.writeFileSync(testFilePath, validPng);

    const res = await request(app)
      .post(`/api/v1/requests/${reqId}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('attachments', testFilePath);

    fs.unlinkSync(testFilePath);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].filename).toContain('testfile.png');
  });

  it('should block MIME spoofing uploads', async () => {
    const spoofedFilePath = path.join(__dirname, 'spoofed.png');
    // Content is plain text, not a valid PNG
    fs.writeFileSync(spoofedFilePath, 'this is a malicious script');

    const res = await request(app)
      .post(`/api/v1/requests/${reqId}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      // It claims to be image/png but content is text
      .attach('attachments', spoofedFilePath, { contentType: 'image/png' });

    fs.unlinkSync(spoofedFilePath);

    // Should return 400 Bad Request due to magic byte mismatch
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid file type detected/i);
  });

  it('should list attachments', async () => {
    const res = await request(app)
      .get(`/api/v1/requests/${reqId}/attachments`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should prevent unauthorized upload', async () => {
    // Create another user not assigned to the request
    const otherUser = await User.create({
      name: 'Other Tech',
      email: 'other_tech@test.com',
      password: 'password123',
      role: 'Technician',
    });
    const jwt = require('jsonwebtoken');
    const otherToken = jwt.sign({ id: otherUser._id, role: otherUser.role }, process.env.JWT_SECRET);

    const testFilePath = path.join(__dirname, 'testfile.png');
    const validPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    fs.writeFileSync(testFilePath, validPng);

    const res = await request(app)
      .post(`/api/v1/requests/${reqId}/attachments`)
      .set('Authorization', `Bearer ${otherToken}`)
      .attach('attachments', testFilePath);

    fs.unlinkSync(testFilePath);

    expect(res.status).toBe(403);
  });
});
