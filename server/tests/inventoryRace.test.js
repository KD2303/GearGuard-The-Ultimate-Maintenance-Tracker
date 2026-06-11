const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../index");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const SparePart = require("../models/SparePart");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

jest.setTimeout(30000);

describe("Race Condition: Spare Parts Inventory Allocation", () => {
  let adminUser, adminToken;
  let partDoc;
  let requestIds = [];
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = mongoServer.getUri();
    
    // Disconnect if already connected (e.g. from app require)
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(uri);

    const hashedPassword = await bcrypt.hash("password123", 10);

    // Create an Admin user for auth
    adminUser = await User.create({
      name: "Admin User",
      email: "admin_race@gearguard.local",
      password: hashedPassword,
      role: "Admin",
      department: "Maintenance"
    });
    
    const loginRes = await request(app)
      .post("/api/auth/login")
      .set("User-Agent", "supertest/1.0.0")
      .send({ email: "admin_race@gearguard.local", password: "password123" });
    
    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    await MaintenanceRequest.deleteMany({ _id: { $in: requestIds } });
    await SparePart.findByIdAndDelete(partDoc._id);
    await User.findByIdAndDelete(adminUser._id);
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Reset or create a spare part with EXACTLY 2 in stock
    if (partDoc) {
      await SparePart.findByIdAndDelete(partDoc._id);
    }
    partDoc = await SparePart.create({
      name: "Race Condition Widget",
      sku: "RC-WIDGET-" + Date.now(),
      quantityInStock: 2,
      minReorderThreshold: 1,
      unitCost: 50
    });

    // Create 3 maintenance requests, each requiring 1 of the above part
    for (let i = 0; i < 3; i++) {
      const newReq = await MaintenanceRequest.create({
        requestNumber: `REQ-RACE-${i}-${Date.now()}`,
        subject: `Race Test Request ${i}`,
        description: "Testing concurrent allocation",
        priority: "medium",
        stage: "in-progress",
        createdBy: adminUser._id,
        partsUsed: [{ partId: partDoc._id, quantityUsed: 1 }]
      });
      requestIds.push(newReq._id);
    }
  });

  afterEach(async () => {
    await MaintenanceRequest.deleteMany({ _id: { $in: requestIds } });
    requestIds = [];
  });

  it("should prevent stock from dropping below zero under highly concurrent completions", async () => {
    // We have 3 requests, but only 2 widgets in stock.
    // Concurrently try to mark all 3 as 'repaired' via updateRequestStage.
    const concurrentRequests = requestIds.map(reqId => {
      return request(app)
        .patch(`/api/requests/${reqId}/stage`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("User-Agent", "supertest/1.0.0")
        .send({ stage: "repaired" });
    });

    const responses = await Promise.all(concurrentRequests);

    let successCount = 0;
    let failCount = 0;

    responses.forEach(res => {
      if (res.status === 200) {
        successCount++;
      } else {
        failCount++;
        // The error should match what decrementInventory throws
        expect(res.body.error).toContain("Insufficient stock for part allocation");
      }
    });

    // Exactly 2 should succeed, 1 should fail
    expect(successCount).toBe(2);
    expect(failCount).toBe(1);

    // Verify inventory level is exactly 0, not -1
    const updatedPart = await SparePart.findById(partDoc._id);
    expect(updatedPart.quantityInStock).toBe(0);

    // Verify the failed request did NOT get marked as 'repaired'
    const failedRequestRes = responses.find(r => r.status !== 200);
    const failedReqIdUrl = failedRequestRes.req.path;
    const failedReqIdMatch = failedReqIdUrl.match(/\/api\/requests\/(.+)\/stage/);
    if (failedReqIdMatch) {
      const failedReqId = failedReqIdMatch[1];
      const failedReqDoc = await MaintenanceRequest.findById(failedReqId);
      expect(failedReqDoc.stage).not.toBe("repaired");
      expect(failedReqDoc.stage).toBe("in-progress");
      expect(failedReqDoc.completionProcessed).toBeFalsy();
    }
  });
});
