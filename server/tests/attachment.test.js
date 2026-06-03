const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const { GridFSBucket } = require('mongodb');

// Set up a mock app and mock auth middleware
const app = express();
app.use(express.json());
const protect = (req, res, next) => {
  req.user = { _id: new mongoose.Types.ObjectId(), role: 'Manager' };
  next();
};

const MaintenanceRequest = require('../models/MaintenanceRequest');
const requestController = require('../controllers/requestController');
const upload = require('../middleware/upload');
const magicByteValidator = require('../middleware/magicByteValidator');

app.post('/api/requests/:id/attachments', protect, upload.array('attachments', 5), magicByteValidator, requestController.uploadAttachments);
app.get('/api/requests/:id/attachments/:attachmentId', protect, requestController.downloadAttachment);
app.delete('/api/requests/:id/attachments/:attachmentId', protect, requestController.deleteAttachment);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Attachment GridFS Tests', () => {
  let requestId;
  // Valid 1x1 PNG magic bytes to pass the magicByteValidator
  let testFileContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

  beforeEach(async () => {
    // Create a mock request
    const reqDoc = await MaintenanceRequest.create({
      requestNumber: 'REQ-12345',
      subject: 'Test Req',
      stage: 'new',
      priority: 'low',
    });
    requestId = reqDoc._id.toString();
  });

  afterEach(async () => {
    await MaintenanceRequest.deleteMany({});
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'attachments' });
    const files = await bucket.find().toArray();
    for (const f of files) {
      await bucket.delete(f._id);
    }
  });

  it('should upload a file to GridFS', async () => {
    const res = await request(app)
      .post(`/api/requests/${requestId}/attachments`)
      .attach('attachments', testFileContent, { filename: 'test.pdf', contentType: 'application/pdf' });
    
    if (res.status !== 200) console.error(res.body);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].filename).toContain('test.pdf');

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'attachments' });
    const files = await bucket.find({ filename: res.body[0].filename }).toArray();
    expect(files.length).toBe(1);
  });

  it('should download a file from GridFS', async () => {
    const uploadRes = await request(app)
      .post(`/api/requests/${requestId}/attachments`)
      .attach('attachments', testFileContent, { filename: 'test.pdf', contentType: 'application/pdf' });
    
    const uploadedFile = uploadRes.body[0];
    const attachmentId = uploadedFile._id;

    const res = await request(app)
      .get(`/api/requests/${requestId}/attachments/${attachmentId}`)
      .responseType('blob');

    expect(res.status).toBe(200);
    const validPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    expect(res.body).toEqual(validPng);
  });

  it('should delete a file from GridFS', async () => {
    const uploadRes = await request(app)
      .post(`/api/requests/${requestId}/attachments`)
      .attach('attachments', testFileContent, { filename: 'test.pdf', contentType: 'application/pdf' });
    
    const uploadedFile = uploadRes.body[0];
    const attachmentId = uploadedFile._id;

    const res = await request(app)
      .delete(`/api/requests/${requestId}/attachments/${attachmentId}`);

    expect(res.status).toBe(200);

    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'attachments' });
    const files = await bucket.find({ filename: uploadedFile.filename }).toArray();
    expect(files.length).toBe(0);
  });
});
