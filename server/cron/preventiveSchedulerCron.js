const cron = require('node-cron');
const { PreventiveSchedule, MaintenanceRequest, Equipment } = require('../models');
const generateRequestNumber = require('../utils/generateRequestNumber');
const NotificationService = require('../services/notificationService');
const { logActivity } = require('../utils/logActivity');

const calculateNextRun = (schedule) => {
  const next = new Date();
  if (schedule.frequency === 'daily') {
    next.setDate(next.getDate() + 1);
  } else if (schedule.frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (schedule.frequency === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else if (schedule.frequency === 'custom') {
    next.setDate(next.getDate() + (schedule.intervalDays || 1));
  }
  return next;
};

const processDueSchedules = async (io) => {
  try {
    const now = new Date();
    const dueSchedules = await PreventiveSchedule.find({
      isActive: true,
      nextRunAt: { $lte: now }
    });

    for (const sched of dueSchedules) {
      const nextRun = calculateNextRun(sched);
      
      const updatedSched = await PreventiveSchedule.findOneAndUpdate(
        { _id: sched._id, nextRunAt: sched.nextRunAt },
        { $set: { nextRunAt: nextRun, lastRunAt: now } },
        { new: true }
      );

      if (updatedSched) {
        const requestNumber = await generateRequestNumber();
        
        const newRequest = await MaintenanceRequest.create({
          requestNumber,
          type: 'preventive',
          stage: 'new',
          priority: 'medium',
          subject: sched.subject,
          description: sched.description,
          equipmentId: sched.equipmentId,
          teamId: sched.teamId,
          assignedToId: sched.assignedToId
        });

        const requestWithRelations = await MaintenanceRequest.findById(newRequest._id)
          .populate("equipment")
          .populate("team")
          .populate("assignedTo", "name email");

        if (sched.equipmentId) {
          await Equipment.findByIdAndUpdate(sched.equipmentId, { status: "under-maintenance" });
        }

        await logActivity({
          type: "request_created",
          title: "New Preventive Request (Auto-generated)",
          description: `${requestWithRelations.equipment?.name || 'Equipment'} - ${sched.subject}`,
          userName: 'System',
          metadata: {
            priority: 'medium',
            stage: 'new',
            requestNumber: requestNumber,
          },
          entityType: "request",
          entityId: String(newRequest._id),
        });

        if (io) {
          await NotificationService.notifyRequestChange(io, "request_created", requestWithRelations);
        }
        
        if (requestWithRelations.assignedTo?.email) {
          try {
            await NotificationService.sendEmail(
              requestWithRelations.assignedTo.email,
              NotificationService.EMAIL_SUBJECTS.ASSIGNED,
              NotificationService.assignmentTemplate(requestWithRelations)
            );
          } catch (error) {
            console.error("EMAIL ERROR:", error);
          }
        }

        if (requestWithRelations.assignedToId) {
          await NotificationService.createAndEmit({
            userId: requestWithRelations.assignedToId,
            title: 'New Preventive Request Assigned',
            message: `You have been assigned an auto-generated preventive maintenance request: "${sched.subject}"`,
            type: 'request_assigned',
            link: '/kanban',
            relatedRequestId: newRequest._id,
          });
        }
      }
    }
  } catch (err) {
    console.error('⏱️  [Cron] Error processing preventive schedules:', err);
  }
};

function startPreventiveSchedulerCron(io) {
  cron.schedule('* * * * *', async () => {
    await processDueSchedules(io);
  });
  console.log('⏱️  [Cron] Preventive scheduler started (Runs every minute).');
}

module.exports = { startPreventiveSchedulerCron, processDueSchedules, calculateNextRun };
