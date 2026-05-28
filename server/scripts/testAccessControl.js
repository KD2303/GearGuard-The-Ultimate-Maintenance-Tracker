const axios = require('axios');
const jwt = require('jsonwebtoken');

// A dummy JWT secret just for generating a fake local token
// We need the real JWT secret to sign a token the server accepts
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_only_if_dev';

function generateFakeTechnicianToken() {
  // Create a payload for a technician NOT assigned to the ticket
  return jwt.sign(
    {
      id: '507f191e810c19729de860ea', // Fake valid ObjectId
      _id: '507f191e810c19729de860ea',
      role: 'Technician',
      name: 'Test Technician'
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function testAccessControl() {
  console.log('--- Testing Broken Access Control Mitigation ---');
  
  // Create a fake token
  const token = generateFakeTechnicianToken();
  console.log('Generated mock token for unassigned technician.');

  // We need to fetch an existing request ID first, or just hit a random endpoint with a fake ID.
  // Actually, we can just grab the first request via an unauthenticated route if possible,
  // or use a dummy ID. If the request doesn't exist, it returns 404. We want to test authorization (403),
  // so we need a real request ID where this technician is not assigned.
  
  try {
    // First, let's just log in as the default admin to get a real request ID
    console.log('Logging in as admin to retrieve a real ticket...');
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'admin@gearguard.com',
      password: 'admin123'
    });
    
    const adminToken = loginRes.data.token;
    const reqRes = await axios.get('http://localhost:5000/api/v1/requests', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (reqRes.data.data.length === 0) {
      console.log('No maintenance requests found to test against.');
      return;
    }
    
    const targetRequestId = reqRes.data.data[0]._id;
    console.log(`Found ticket: ${targetRequestId}. Attempting unauthorized stage change...`);

    // Now send the PATCH request with the fake technician token
    // Wait, the fake token might be rejected by auth middleware if the secret doesn't match
    // Let's see what happens.
    const patchRes = await axios.patch(`http://localhost:5000/api/v1/requests/${targetRequestId}/stage`, 
      { stage: 'repaired' },
      { 
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true 
      }
    );

    if (patchRes.status === 401) {
       console.log('Token rejected by auth middleware. (JWT secret mismatch in script vs server). But this means the route is protected.');
    } else if (patchRes.status === 403) {
      console.log('✅ PASS: Server correctly rejected the request with 403 Forbidden! Access control is enforced.');
    } else {
      console.error(`❌ FAIL: Server allowed or improperly handled the request. Status: ${patchRes.status}`);
      console.error(patchRes.data);
    }
    
  } catch (err) {
    console.error('Test script error:', err.message);
  }
}

testAccessControl();
