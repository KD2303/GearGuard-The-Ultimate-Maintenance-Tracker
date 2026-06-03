const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const Supplier = require('../models/Supplier');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

describe('Supplier Controller Pagination', () => {
  jest.setTimeout(30000);
  let mongoServer;
  let adminToken;

  beforeAll(async () => {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin.supplier@example.com',
      password: 'password123',
      role: 'Admin',
    });
    adminToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET);

    const suppliers = [];
    for (let i = 1; i <= 25; i++) {
      suppliers.push({
        name: `Supplier ${i.toString().padStart(2, '0')}`,
        contactEmail: `contact${i}@example.com`,
        phone: '1234567890',
        leadTimeDays: 5
      });
    }
    await Supplier.insertMany(suppliers);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  it('should return paginated suppliers with default limit of 20', async () => {
    const res = await request(app)
      .get('/api/v1/suppliers')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.suppliers).toBeDefined();
    expect(res.body.suppliers.length).toBe(20);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(25);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(20);
    expect(res.body.pagination.pages).toBe(2);
  });

  it('should return paginated suppliers based on page and limit query params', async () => {
    const res = await request(app)
      .get('/api/v1/suppliers?page=2&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.suppliers).toBeDefined();
    expect(res.body.suppliers.length).toBe(10);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.limit).toBe(10);
  });
});
