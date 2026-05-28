const { mongoose } = require('../config/database');
const { MaintenanceRequest, Equipment, SparePart, TeamMember } = require('../models');
require('dotenv').config({ path: __dirname + '/../../.env' });

async function seedPredictions() {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gearguard');
    console.log('Connected.');

    // Get an equipment
    const equipment = await Equipment.findOne({});
    if (!equipment) {
      console.log('No equipment found. Please create one in UI first.');
      process.exit(1);
    }

    // Get some parts
    const parts = await SparePart.find().limit(3);
    if (parts.length === 0) {
      console.log('No parts found. Creating mock parts...');
      const part1 = await SparePart.create({ name: 'Cooling Fan V2', sku: 'CF-002', quantityInStock: 20, unitCost: 15 });
      const part2 = await SparePart.create({ name: 'Hydraulic Seal', sku: 'HS-991', quantityInStock: 50, unitCost: 5 });
      parts.push(part1, part2);
    }

    // Get a user
    const user = await TeamMember.findOne({});

    // Create a historical resolved request
    console.log('Creating historical resolved request...');
    await MaintenanceRequest.create({
      requestNumber: `REQ-HIST-${Date.now()}`,
      subject: 'Machine is overheating',
      description: 'The engine got way too hot due to overheating issues.',
      stage: 'repaired',
      equipmentId: equipment._id,
      createdById: user ? user._id : undefined,
      partsUsed: [{ partId: parts[0]._id, quantityUsed: 1 }]
    });

    console.log('Creating current active request for prediction...');
    const currentReq = await MaintenanceRequest.create({
      requestNumber: `REQ-CURR-${Date.now()}`,
      subject: 'Engine overheating again',
      description: 'Showing overheating warnings on the dash.',
      stage: 'new',
      equipmentId: equipment._id,
      createdById: user ? user._id : undefined,
    });

    console.log('--- SEEDING COMPLETE ---');
    console.log(`To see the AI Predictor, click on request: ${currentReq.requestNumber} (${currentReq.subject}) in the UI!`);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seedPredictions();
