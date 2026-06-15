const cron = require('node-cron');
const Tool = require('../models/Tool');
const NotificationService = require('../services/notificationService');

const startCalibrationChecker = () => {
  // Runs daily at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Find tools needing calibration within 7 days
      const dueSoon = await Tool.find({
        requiresCalibration: true,
        nextCalibrationDue: { $gte: now, $lte: sevenDaysFromNow },
        calibrationNotified: { $ne: true },
        status: { $ne: 'Lost' }
      });

      for (const tool of dueSoon) {
        const daysLeft = Math.ceil((new Date(tool.nextCalibrationDue) - now) / (1000 * 60 * 60 * 24));

        await NotificationService.createAndEmit({
          title: '🔧 Calibration Due Soon',
          message: `Tool "${tool.name}" (${tool.serialNumber}) requires calibration in ${daysLeft} day(s) — due ${new Date(tool.nextCalibrationDue).toLocaleDateString()}.`,
          type: 'equipment_status',
          link: '/tools',
        });

        tool.calibrationNotified = true;
        await tool.save();
      }

      // Find overdue calibrations
      const overdue = await Tool.find({
        requiresCalibration: true,
        nextCalibrationDue: { $lt: now },
        status: { $nin: ['Lost', 'In Repair'] }
      });

      for (const tool of overdue) {
        // Only notify once per overdue cycle
        if (!tool.calibrationNotified) {
          await NotificationService.createAndEmit({
            title: '🚨 Calibration Overdue',
            message: `Tool "${tool.name}" (${tool.serialNumber}) is OVERDUE for calibration since ${new Date(tool.nextCalibrationDue).toLocaleDateString()}. Remove from service until recalibrated.`,
            type: 'equipment_status',
            link: '/tools',
          });

          tool.calibrationNotified = true;
          await tool.save();
        }
      }

      const total = dueSoon.length + overdue.filter(t => !t.calibrationNotified).length;
      if (total > 0) {
        console.log(`Calibration checker: notified for ${total} tool(s).`);
      }
    } catch (error) {
      console.error('Calibration checker error:', error.message);
    }
  });

  console.log('Tool calibration checker cron job started.');
};

module.exports = { startCalibrationChecker };
