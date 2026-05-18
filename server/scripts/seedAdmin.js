require('dotenv').config({ path: __dirname + '/../../.env' });
const bcrypt = require('bcryptjs');
const { connectDatabase } = require('../config/database');
const User = require('../models/user');

const seed = async () => {
  await connectDatabase();

  const existing = await User.findOne({ email: 'admin@gearguard.com' });
  if (existing) {
    console.log('✅ Admin user already exists');
    process.exit(0);
  }

  const password = await bcrypt.hash('admin123', 10);
  await User.create({ name: 'Admin', email: 'admin@gearguard.com', password, role: 'Admin' });
  console.log('✅ Admin user created: admin@gearguard.com / admin123');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
