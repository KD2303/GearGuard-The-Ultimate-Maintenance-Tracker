const { mongoose } = require('../config/database');
const { MaintenanceRequest } = require('../models');
require('dotenv').config({ path: __dirname + '/../../.env' });

async function fixZombieSlas() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gearguard');
    const result = await MaintenanceRequest.updateMany(
      { stage: 'scrap', slaBreached: true },
      { $set: { slaBreached: false, preBreachWarningSent: false, slaNotified: false } }
    );
    
    console.log(`✅ Fixed ${result.modifiedCount} scrapped tickets that were incorrectly marked as SLA breached.`);
    process.exit(0);
  } catch (err) {
    console.error('Error fixing zombie SLAs:', err);
    process.exit(1);
  }
}

fixZombieSlas();
