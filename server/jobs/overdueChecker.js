const cron = require('node-cron');
const { MaintenanceRequest } = require('../models');
const NotificationService = require('../services/notificationService');

const startOverdueChecker = () => {
  // Runs every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();

      const overdueRequests = await MaintenanceRequest.find({
        scheduledDate: { $lt: now },
        stage: { $nin: ['repaired', 'scrap'] },
        overdueNotified: { $ne: true },
      }).populate('assignedToId', '_id name');

      for (const request of overdueRequests) {
        if (request.assignedToId) {
          await NotificationService.createAndEmit({
            userId: request.assignedToId._id || request.assignedToId,
            title: '⚠️ Overdue Request',
            message: `Maintenance request "${request.subject || request.requestNumber}" is overdue and still ${request.stage}.`,
            type: 'request_overdue',
            link: '/kanban',
            relatedRequestId: request._id,
          });
        }

        // Mark as notified so we don't spam
        request.overdueNotified = true;
        await request.save();
      }

      if (overdueRequests.length > 0) {
        console.log(`Overdue checker: notified for ${overdueRequests.length} request(s).`);
      }
    } catch (error) {
      console.error('Overdue checker error:', error.message);
    }
  });

  console.log('Overdue checker cron job started.');
};

module.exports = { startOverdueChecker };
