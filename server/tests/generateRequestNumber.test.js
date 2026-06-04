const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const generateRequestNumber = require('../utils/generateRequestNumber');
const { Counter } = require('../models');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Counter.deleteMany({});
});

describe('generateRequestNumber', () => {
  it('should generate a formatted request number', async () => {
    const reqNum = await generateRequestNumber();
    expect(reqNum).toMatch(/^REQ-\d{6}-0001$/);
  });

  it('should handle high concurrency and never produce duplicates', async () => {
    const NUM_REQUESTS = 100;
    
    // Simulate NUM_REQUESTS concurrent requests
    const promises = [];
    for (let i = 0; i < NUM_REQUESTS; i++) {
      promises.push(generateRequestNumber());
    }

    const results = await Promise.all(promises);

    // Use a Set to ensure all generated numbers are unique
    const uniqueResults = new Set(results);
    
    expect(uniqueResults.size).toBe(NUM_REQUESTS);
    
    const counterDoc = await Counter.findOne({});
    expect(counterDoc.seq).toBe(NUM_REQUESTS);
  });
});
