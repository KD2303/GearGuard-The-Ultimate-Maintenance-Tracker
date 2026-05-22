const cron = require('node-cron');
const procurementController = require('../controllers/procurementController');

const startProcurementCron = () => {
  // Run every day at midnight server time
  cron.schedule('0 0 * * *', async () => {
    console.log('📦 Running daily procurement forecasting and auto-draft PO job...');
    try {
      // Create a mock req/res to call the controller function internally
      const req = {};
      const res = {
        status: () => res,
        json: (data) => console.log('📦 Procurement Drafts Created:', data.draftsCreated)
      };
      const next = (err) => console.error('📦 Procurement Cron Error:', err);
      
      await procurementController.autoDraftPO(req, res, next);
    } catch (error) {
      console.error('📦 Failed to run procurement cron:', error);
    }
  });
  console.log('⏱️  Procurement Forecasting Cron Job Scheduled (Daily at Midnight)');
};

module.exports = { startProcurementCron };
