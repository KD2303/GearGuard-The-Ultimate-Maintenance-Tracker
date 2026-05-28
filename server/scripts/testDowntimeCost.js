const { mongoose } = require('../config/database');
const { MaintenanceRequest, Equipment, TeamMember } = require('../models');
require('dotenv').config({ path: __dirname + '/../../.env' });

async function seedDowntimeTest() {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gearguard');
    console.log('Connected.');

    // 1. Create a machine with a high hourly cost
    console.log('Creating high-value equipment...');
    const equipment = await Equipment.create({
      name: 'Industrial CNC Router',
      serialNumber: `CNC-${Date.now()}`,
      category: 'Machine',
      location: 'Factory Floor A',
      status: 'active',
      hourlyDowntimeCost: 500 // $500 an hour
    });

    const user = await TeamMember.findOne({});

    // 2. Create a request and backdate its creation to 48 hours ago
    console.log('Creating ticket backdated by 48 hours...');
    const pastDate = new Date(Date.now() - (48 * 60 * 60 * 1000));
    
    const request = await MaintenanceRequest.create({
      requestNumber: `REQ-DT-${Date.now()}`,
      subject: 'Spindle motor failure',
      description: 'The main spindle motor burnt out.',
      stage: 'in-progress',
      equipmentId: equipment._id,
      createdById: user ? user._id : undefined,
      createdAt: pastDate
    });

    console.log(`Created Request ID: ${request._id}`);
    console.log('Use the UI to drag this ticket to "Repaired" and check the Analytics Dashboard to see $24,000 in Financial Bleed!');

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seedDowntimeTest();
