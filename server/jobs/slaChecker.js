const cron = require('node-cron');
const { MaintenanceRequest } = require('../models');
const NotificationService = require('../services/notificationService');
const PredictionService = require('../services/predictionService');
const requestController = require('../controllers/requestController');

const startSlaChecker = (io) => {
  // Runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      const breachedRequests = await MaintenanceRequest.find({
        slaDeadline: { $lt: now },
        stage: { $nin: ['repaired', 'scrap'] },
        slaNotified: { $ne: true },
      }).populate('assignedToId', '_id name').populate('createdById', '_id name');

      for (const request of breachedRequests) {
        request.slaBreached = true;
        request.slaNotified = true;

        if (request.assignedToId) {
          await NotificationService.createAndEmit({
            userId: request.assignedToId._id || request.assignedToId,
            title: '🚨 SLA Breach!',
            message: `Maintenance request "${request.subject || request.requestNumber}" has breached its SLA!`,
            type: 'request_overdue',
            link: '/kanban',
            relatedRequestId: request._id,
          });
        }
        
        // Also notify the creator/manager if different
        const assigneeStr = String(request.assignedToId?._id || request.assignedToId);
        const creatorStr = String(request.createdById?._id || request.createdById);
        
        if (creatorStr && creatorStr !== assigneeStr) {
          await NotificationService.createAndEmit({
            userId: request.createdById._id || request.createdById,
            title: '🚨 SLA Breach Escalatation',
            message: `Maintenance request "${request.subject || request.requestNumber}" assigned to ${request.assignedToId?.name || 'Unassigned'} has breached its SLA!`,
            type: 'request_overdue',
            link: '/kanban',
            relatedRequestId: request._id,
          });
        }

        await request.save();
      }

      // Predictive SLA Routing (High Risk >= 85%)
      const highRiskRequests = await PredictionService.updateAllOpenRequests();
      let escalatedCount = 0;

      for (const request of highRiskRequests) {
        if (!request.preBreachWarningSent) {
          // 1. Send warning
          await NotificationService.createAndEmit({
            userId: request.assignedToId?._id || request.assignedToId || request.createdById?._id || request.createdById,
            title: '⚠️ High SLA Breach Risk',
            message: `Maintenance request "${request.subject || request.requestNumber}" is at ${request.slaBreachProbability}% risk of breaching its SLA.`,
            type: 'pre_breach_warning',
            link: '/kanban',
            relatedRequestId: request._id,
          });
          
          request.preBreachWarningSent = true;
          await request.save();

          // 2. Auto-route if unassigned
          if (!request.assignedToId) {
            try {
              await requestController.smartAssignInternal(request._id, io);
              console.log(`SLA checker: Auto-assigned high-risk request ${request.requestNumber}`);
            } catch (err) {
              console.error(`SLA checker: Failed to auto-assign ${request.requestNumber} - ${err.message}`);
            }
          }
          
          escalatedCount++;
        }
      }

      if (breachedRequests.length > 0) {
        console.log(`SLA checker: escalated ${breachedRequests.length} breached request(s).`);
      }
      if (escalatedCount > 0) {
        console.log(`SLA checker: predicted and acted on ${escalatedCount} high-risk request(s).`);
      }
    } catch (error) {
      console.error('SLA checker error:', error.message);
    }
  });

  console.log('SLA checker cron job started.');
};

module.exports = { startSlaChecker };
