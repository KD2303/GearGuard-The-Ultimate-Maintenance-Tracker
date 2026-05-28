const mongoose = require('mongoose');
const MaintenanceRequest = require('../models/MaintenanceRequest');

async function checkComments() {
  await mongoose.connect('mongodb://localhost:27017/gearguard');
  const request = await MaintenanceRequest.findById('6a130501d8c3ce8475e7fb0f');
  console.log("📄 Ticket Comments in Database:");
  console.log(JSON.stringify(request.comments, null, 2));
  await mongoose.disconnect();
}

checkComments();
