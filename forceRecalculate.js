const { mongoose } = require('./server/config/database');
const { recalculateAllHealthScores } = require('./server/services/healthScoreService');
require('dotenv').config({ path: __dirname + '/.env' });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gearguard');
    await recalculateAllHealthScores();
    console.log('Recalculation finished.');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
