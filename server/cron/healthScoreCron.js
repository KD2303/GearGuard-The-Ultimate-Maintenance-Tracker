const cron = require('node-cron');
const { recalculateAllHealthScores } = require('../services/healthScoreService');

function startHealthScoreCron() {
  // Run every night at 1:00 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('⏱️  [Cron] Running daily health score recalculation...');
    await recalculateAllHealthScores();
  });
  console.log('⏱️  [Cron] Health score recalculation scheduled (Daily at 1:00 AM).');
}

module.exports = { startHealthScoreCron };
