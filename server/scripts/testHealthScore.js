const { mongoose } = require('../config/database');
const { MaintenanceRequest, Equipment, TeamMember } = require('../models');
const { calculateAndUpdateHealthScore } = require('../services/healthScoreService');
require('dotenv').config({ path: __dirname + '/../../.env' });

async function seedTest() {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gearguard');
    console.log('Connected.');

    // 1. Create a 1-year old machine (Penalty: -2 points)
    console.log('Creating a 1-year old equipment...');
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const equipment = await Equipment.create({
      name: 'Diagnostic Testing Rig',
      serialNumber: `DTR-${Date.now()}`,
      category: 'Machine',
      location: 'Lab 1',
      status: 'active',
      purchaseDate: oneYearAgo
    });

    // 2. Create a recent corrective ticket (Penalty: -10 points)
    const user = await TeamMember.findOne({});
    console.log('Creating a recent corrective breakdown ticket...');
    const tenDaysAgo = new Date(Date.now() - (10 * 24 * 60 * 60 * 1000));
    await MaintenanceRequest.create({
      requestNumber: `REQ-HS-1`,
      subject: 'Calibration failure',
      type: 'corrective',
      stage: 'repaired',
      equipmentId: equipment._id,
      createdById: user ? user._id : undefined,
      createdAt: tenDaysAgo
    });

    // 3. Create an overdue open ticket (Penalty: -15 points)
    console.log('Creating an overdue open ticket...');
    const overdueDate = new Date(Date.now() - (5 * 24 * 60 * 60 * 1000));
    await MaintenanceRequest.create({
      requestNumber: `REQ-HS-2`,
      subject: 'Quarterly checkup overdue',
      type: 'preventive',
      stage: 'new',
      equipmentId: equipment._id,
      scheduledDate: overdueDate,
      createdById: user ? user._id : undefined,
      createdAt: overdueDate
    });

    // Run the algorithmic engine
    console.log('Running health score algorithm...');
    const score = await calculateAndUpdateHealthScore(equipment._id);
    console.log(`\n✅ TEST COMPLETE! Expected Score: 73 (100 - 2 age - 10 breakdown - 15 overdue)`);
    console.log(`📊 Calculated Score: ${score}`);
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seedTest();
