const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const envUri = process.env.MONGO_URI || process.env.MONGO_URL;

const seedMockData = async () => {
  try {
    const { Equipment, MaintenanceTeam, TeamMember, MaintenanceRequest } = require('../models');
    const User = require('../models/user');
    const bcrypt = require('bcryptjs');
    
    // Check if equipment already exists
    const count = await Equipment.countDocuments();
    if (count > 0) return; // already seeded!

    console.log('🌱 Seeding premium mock data into database...');

    // 0. Seed Default Admin User
    const adminUser = await User.findOne({ email: 'admin@gearguard.com' });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin@gearguard.com',
        password: hashedPassword,
        role: 'Admin',
        isActive: true
      });
    }

    // 1. Create Teams
    const team1 = await MaintenanceTeam.create({ name: 'Mechanical Crew', specialization: 'Hydraulics & Engines' });
    const team2 = await MaintenanceTeam.create({ name: 'Electrical Crew', specialization: 'HVAC & Power Systems' });

    // 2. Create Team Members (Technicians)
    const tech1 = await TeamMember.create({ name: 'John Doe', email: 'john@gearguard.com', role: 'Technician', maintenanceTeamId: team1._id, isActive: true });
    const tech2 = await TeamMember.create({ name: 'Jane Smith', email: 'jane@gearguard.com', role: 'Technician', maintenanceTeamId: team2._id, isActive: true });
    const tech3 = await TeamMember.create({ name: 'Bob Johnson', email: 'bob@gearguard.com', role: 'Technician', maintenanceTeamId: team1._id, isActive: true });

    // 3. Create Equipment and Vehicles
    const eq1 = await Equipment.create({
      name: 'Heavy Duty CNC Lathe',
      serialNumber: 'CNC-8829',
      category: 'Machinery',
      location: 'Production Bay A',
      status: 'active',
      maintenanceTeamId: team1._id,
      defaultTechnicianId: tech1._id,
      manufacturer: 'Okuma',
      model: 'LB3000',
      department: 'Production',
      purchaseDate: new Date('2024-01-15'),
      warrantyExpiry: new Date('2026-01-15')
    });

    const eq2 = await Equipment.create({
      name: 'Industrial Air Compressor',
      serialNumber: 'IAC-0034',
      category: 'Facility Support',
      location: 'Compressor Room B',
      status: 'under-maintenance',
      maintenanceTeamId: team1._id,
      defaultTechnicianId: tech3._id,
      manufacturer: 'Atlas Copco',
      model: 'GA37',
      department: 'Facilities',
      purchaseDate: new Date('2023-06-10'),
      warrantyExpiry: new Date('2025-06-10')
    });

    const eq3 = await Equipment.create({
      name: 'HVAC System - Server Room',
      serialNumber: 'HVAC-9910',
      category: 'HVAC',
      location: 'Main Server Room',
      status: 'active',
      maintenanceTeamId: team2._id,
      defaultTechnicianId: tech2._id,
      manufacturer: 'Daikin',
      model: 'VRV-IV',
      department: 'IT Infrastructure',
      purchaseDate: new Date('2022-11-20'),
      warrantyExpiry: new Date('2025-11-20')
    });

    const v1 = await Equipment.create({
      name: 'Toyota Forklift',
      serialNumber: 'TOY-FL-02',
      category: 'Vehicle',
      location: 'Warehouse Dock 4',
      status: 'active',
      maintenanceTeamId: team1._id,
      defaultTechnicianId: tech1._id,
      licensePlate: 'GG-FORK-02',
      currentMileage: 14200,
      fuelType: 'Electric',
      manufacturer: 'Toyota',
      model: '8FGU25',
      department: 'Logistics',
      purchaseDate: new Date('2023-03-05'),
      warrantyExpiry: new Date('2026-03-05')
    });

    // 4. Create Maintenance Requests
    await MaintenanceRequest.create({
      subject: 'CNC Oil leak',
      description: 'Lathe is leaking coolant and hydraulic oil at the main spindle seal.',
      type: 'corrective',
      priority: 'high',
      stage: 'new',
      equipmentId: eq1._id,
      teamId: team1._id,
      assignedToId: tech1._id,
      requestNumber: 'REQ-0001',
      scheduledDate: new Date()
    });

    await MaintenanceRequest.create({
      subject: 'Compressor over pressure',
      description: 'Compressor warning light is flashing red and the system pressure has exceeded safety thresholds.',
      type: 'corrective',
      priority: 'urgent',
      stage: 'new',
      equipmentId: eq2._id,
      teamId: team1._id,
      assignedToId: tech3._id,
      requestNumber: 'REQ-0002',
      scheduledDate: new Date()
    });

    await MaintenanceRequest.create({
      subject: 'HVAC Filter Replacement',
      description: 'Scheduled replacement of intake and output filtration pads in the Server Room HVAC unit.',
      type: 'preventive',
      priority: 'medium',
      stage: 'in-progress',
      equipmentId: eq3._id,
      teamId: team2._id,
      assignedToId: tech2._id,
      requestNumber: 'REQ-0003',
      scheduledDate: new Date()
    });

    console.log('✓ Mock data successfully seeded.');
  } catch (err) {
    console.error('✗ Failed to seed mock data:', err.message || err);
  }
};

const connectDatabase = async () => {
  if (!envUri) {
    console.error('✗ MONGO_URI is not defined in the environment variables.');
    console.error('Please ensure you have a .env file with MONGO_URI set.');
    throw new Error('MONGO_URI missing');
  }

  try {
    console.log(`📡 Connecting to primary MongoDB: ${envUri}`);
    // Set connection timeout to 4 seconds to fail fast and trigger in-memory fallback
    await mongoose.connect(envUri, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 4000 
    });
    console.log(`✓ MongoDB connected successfully.`);
    await seedMockData();
  } catch (err) {
    console.warn('⚠️ Unable to connect to primary MongoDB Atlas cluster (IP Whitelist restriction likely).');
    console.log('🔄 Spinning up Zero-Config Local In-Memory MongoDB Server...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      console.log(`✓ Local In-Memory MongoDB Server running at: ${mongoUri}`);
      await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log(`✓ MongoDB connected successfully to local in-memory fallback!`);
      await seedMockData();
    } catch (fallbackErr) {
      console.error('✗ Failed to spin up local in-memory database:', fallbackErr.message || fallbackErr);
      throw fallbackErr;
    }
  }
};

module.exports = { mongoose, connectDatabase };
