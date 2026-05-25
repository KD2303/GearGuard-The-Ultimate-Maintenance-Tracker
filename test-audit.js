require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:47749/');
    console.log("DB connected");

    const MaintenanceRequest = require('./server/models/MaintenanceRequest');
    const req = await MaintenanceRequest.findOne();
    if (!req) {
      console.log("No requests found");
      process.exit(1);
    }
    console.log("Request ID:", req._id);

    const token = jwt.sign({ id: req.createdBy || req.assignedTo || '600000000000000000000000' }, process.env.JWT_SECRET);
    
    const axios = require('axios');
    try {
      const res = await axios.get(`http://localhost:5000/api/v1/audit/MaintenanceRequest/${req._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Audit GET Success:", res.data);
    } catch (err) {
      console.log("Audit GET Error:", err.response ? err.response.data : err.message);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
