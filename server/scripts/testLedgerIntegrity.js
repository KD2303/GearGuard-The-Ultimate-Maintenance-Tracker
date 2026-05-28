const axios = require('axios');
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
require('dotenv').config({ path: '../.env' });

async function testLedgerIntegrity() {
  console.log('--- Testing Cryptographic Audit Ledger Integrity ---');

  try {
    // 1. Connect to Database directly for tampering
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gearguard');
    console.log('Connected to MongoDB.');

    // 2. Login as admin to get token
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'admin@gearguard.com',
      password: 'admin123'
    });
    const adminToken = loginRes.data.token;

    // 3. Verify Ledger (Should be Intact)
    let verifyRes = await axios.get('http://localhost:5000/api/v1/audit/verify', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('Initial Verify Result:', verifyRes.data);

    if (verifyRes.data.status !== 'Intact') {
      console.log('Ledger is already compromised. Cannot run test properly.');
      process.exit(1);
    }

    if (verifyRes.data.totalLogsVerified > 0) {
      // 4. Tamper with the database
      console.log('\nSimulating a malicious database tampering attack...');
      
      const lastLog = await AuditLog.findOne().sort({ createdAt: -1 });
      
      // Change the action field without updating the hash
      await AuditLog.updateOne({ _id: lastLog._id }, { $set: { action: 'DELETE' } });
      console.log(`Tampered with AuditLog ${lastLog._id}`);

      // 5. Verify Ledger again (Should be Compromised)
      verifyRes = await axios.get('http://localhost:5000/api/v1/audit/verify', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('\nPost-Tamper Verify Result:', verifyRes.data);

      if (verifyRes.data.status === 'Compromised') {
        console.log('✅ PASS: System correctly detected the cryptographic tampering attack!');
      } else {
        console.log('❌ FAIL: System failed to detect database tampering.');
      }

      // Revert the tamper to keep things clean
      await AuditLog.updateOne({ _id: lastLog._id }, { $set: { action: lastLog.action } });
      console.log('Reverted tampering for system stability.');
    } else {
      console.log('No audit logs exist yet to tamper with. Triggering a test log...');
      // Creating a log manually using the new hash function would require running the server function.
      // Easiest is just to create a request to generate a log, then run this test again.
    }

    mongoose.connection.close();
  } catch (err) {
    console.error('Test script error:', err.message);
    mongoose.connection.close();
  }
}

testLedgerIntegrity();
