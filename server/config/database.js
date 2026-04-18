const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const envUri = process.env.MONGO_URI || process.env.MONGO_URL;

const connectDatabase = async () => {
  if (!envUri) {
    console.error('✗ MONGO_URI is not defined in the environment variables.');
    console.error('Please ensure you have a .env file with MONGO_URI set.');
    throw new Error('MONGO_URI missing');
  }

  try {
    await mongoose.connect(envUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log(`✓ MongoDB connected: ${envUri}`);
  } catch (err) {
    console.error('✗ Unable to connect to MongoDB.');
    console.error('Error:', err.message || err);
    throw err;
  }
};

module.exports = { mongoose, connectDatabase };
