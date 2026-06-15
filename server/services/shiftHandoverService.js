const cron = require('node-cron');
const ShiftHandover = require('../models/ShiftHandover');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const TeamMember = require('../models/TeamMember');
const Tool = require('../models/Tool'); // Assumes Tool model exists or can be bypassed if not

const startAutomatedHandovers = (io) => {
  // 06:00, 14:00, 22:00
  const times = [
    { cron: '0 6 * * *', type: 'Morning' },
    { cron: '0 14 * * *', type: 'Afternoon' },
    { cron: '0 22 * * *', type: 'Night' }
  ];

  times.forEach(({ cron: schedule, type }) => {
    cron.schedule(schedule, async () => {
      try {
        console.log(`Generating automated shift handover report for ${type} shift...`);
        
        const systemUser = await TeamMember.findOne({ role: 'Admin' }) || await TeamMember.findOne();
        if (!systemUser) return;
        
        const openRequests = await MaintenanceRequest.find({
          stage: { $nin: ['repaired', 'scrap'] }
        }).select('_id');
        const ongoingRepairs = openRequests.map(req => req._id);

        const urgentRequests = await MaintenanceRequest.find({
          stage: { $nin: ['repaired', 'scrap'] },
          priority: 'urgent'
        });
        
        let safetyWarnings = urgentRequests.length > 0 
          ? `Urgent requests pending: ${urgentRequests.length}. Please review safety protocols.` 
          : 'No immediate urgent safety warnings from maintenance tickets.';

        let toolsInfo = '';
        try {
          const checkedOutTools = await Tool.find({ status: 'Checked Out' });
          if (checkedOutTools.length > 0) {
            toolsInfo = `\nChecked out tools count: ${checkedOutTools.length}`;
          }
        } catch(e) {
          // Ignore if Tool model lacks status or doesn't exist as expected
        }

        const notes = `Automated handover report for ${type} shift. Open requests: ${ongoingRepairs.length}.${toolsInfo}`;

        const handover = new ShiftHandover({
          shiftType: type,
          submittedBy: systemUser._id,
          notes,
          safetyWarnings,
          ongoingRepairs,
          acknowledgedBy: []
        });

        await handover.save();

        const populatedHandover = await ShiftHandover.findById(handover._id)
          .populate('submittedBy', 'name email')
          .populate({
            path: 'ongoingRepairs',
            select: 'requestNumber subject stage priority',
            populate: { path: 'equipment', select: 'name status' }
          });

        if (io) {
          io.emit('new_shift_handover', populatedHandover);
          io.emit('notification', {
            type: 'system',
            title: 'New Shift Handover',
            message: `Automated handover report generated for ${type} shift.`,
          });
        }

        console.log(`Automated shift handover report generated successfully.`);
      } catch (err) {
        console.error('Error generating automated shift handover:', err);
      }
    });
  });
};

module.exports = { startAutomatedHandovers };
