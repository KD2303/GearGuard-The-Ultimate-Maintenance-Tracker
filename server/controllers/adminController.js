const Equipment = require('../models/Equipment');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const TeamMember = require('../models/TeamMember');
const Activity = require('../models/Activity');

// Helper to get date sub days
const subDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

// Helper to format date as 'Jan 01'
const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
};

// Helper to get range of dates
const eachDayOfInterval = ({ start, end }) => {
  const dates = [];
  let curr = new Date(start);
  while (curr <= end) {
    dates.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

// Helper to get trend (percentage change from previous period)
const getTrend = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

exports.getMetrics = async (req, res) => {
  try {
    const today = new Date();
    const lastWeek = subDays(today, 7);
    const twoWeeksAgo = subDays(today, 14);

    // Total Equipment
    const totalEquipment = await Equipment.countDocuments();
    const totalEquipmentLastWeek = await Equipment.countDocuments({ createdAt: { $lt: lastWeek } });
    const equipmentTrend = getTrend(totalEquipment, totalEquipmentLastWeek);

    // Active Requests (new, in-progress)
    const activeRequests = await MaintenanceRequest.countDocuments({ stage: { $in: ['new', 'in-progress'] } });
    const activeRequestsLastWeek = await MaintenanceRequest.countDocuments({ 
      stage: { $in: ['new', 'in-progress'] },
      createdAt: { $lt: lastWeek }
    });
    const activeRequestsTrend = getTrend(activeRequests, activeRequestsLastWeek);

    // Overdue Requests
    const overdueRequests = await MaintenanceRequest.countDocuments({
      stage: { $in: ['new', 'in-progress'] },
      scheduledDate: { $lt: today }
    });
    const overdueRequestsLastWeek = await MaintenanceRequest.countDocuments({
      stage: { $in: ['new', 'in-progress'] },
      scheduledDate: { $lt: lastWeek }
    });
    const overdueTrend = getTrend(overdueRequests, overdueRequestsLastWeek);

    // Team Count
    const teamCount = await TeamMember.countDocuments({ isActive: true });

    // Team Utilization Rate
    // Let's define it as: (technicians with active assignments / total technicians) * 100
    const assignedTechnicians = await MaintenanceRequest.distinct('assignedToId', {
      stage: { $in: ['new', 'in-progress'] }
    });
    const utilizationRate = teamCount > 0 ? Math.round((assignedTechnicians.length / teamCount) * 100) : 0;
    // For trend, we'll just mock it or skip it if no historical utilization data is available. 
    // Usually we'd need a Snapshot model. For now, let's return a static or calculated trend.
    const utilizationTrend = 2; // mock trend for now as we don't have historical utilization snapshots

    // Equipment Availability (%)
    // Definition: (equipment not in 'under-maintenance' / total equipment) * 100
    const underMaintenance = await Equipment.countDocuments({ status: 'under-maintenance' });
    const availability = totalEquipment > 0 ? Math.round(((totalEquipment - underMaintenance) / totalEquipment) * 100) : 100;
    const availabilityTrend = 0;

    res.json({
      totalEquipment: { value: totalEquipment, trend: equipmentTrend },
      activeRequests: { value: activeRequests, trend: activeRequestsTrend },
      teamCount: { value: teamCount, trend: 0 },
      utilizationPercentage: { value: utilizationRate, trend: utilizationTrend },
      overdueCount: { value: overdueRequests, trend: overdueTrend },
      availability: { value: availability, trend: availabilityTrend }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);

    // A. Maintenance Trend (Line Chart)
    const requests = await MaintenanceRequest.find({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    const maintenanceTrend = days.map(day => {
      const dayStr = formatDate(day);
      const dayRequests = requests.filter(r => formatDate(new Date(r.createdAt)) === dayStr);
      return {
        date: dayStr,
        corrective: dayRequests.filter(r => r.type === 'corrective').length,
        preventive: dayRequests.filter(r => r.type === 'preventive').length
      };
    });

    // B. Equipment Status Distribution (Pie Chart)
    const equipment = await Equipment.find();
    const statusDistribution = [
      { name: 'Active', value: equipment.filter(e => e.status === 'active').length, color: '#10B981' },
      { name: 'Maintenance', value: equipment.filter(e => e.status === 'under-maintenance').length, color: '#F59E0B' },
      { name: 'Idle', value: equipment.filter(e => e.status === 'inactive').length, color: '#6B7280' },
      { name: 'Retired', value: equipment.filter(e => e.status === 'scrapped').length, color: '#EF4444' }
    ];

    // C. Team Workload (Bar Chart)
    const members = await TeamMember.find({ isActive: true });
    const activeRequests = await MaintenanceRequest.find({ stage: { $in: ['new', 'in-progress'] } });
    
    const teamWorkload = members.map(member => {
      const count = activeRequests.filter(r => r.assignedToId?.toString() === member._id.toString()).length;
      return {
        name: member.name,
        requests: count,
        overloaded: count > 5 // Threshold for overloaded
      };
    });

    // D. Request Type Breakdown (Stacked Bar)
    // For this week vs last week
    const lastWeek = subDays(today, 7);
    const thisWeekRequests = await MaintenanceRequest.find({ createdAt: { $gte: lastWeek } });
    const lastWeekRequests = await MaintenanceRequest.find({ 
      createdAt: { $gte: subDays(today, 14), $lt: lastWeek } 
    });

    const typeBreakdown = [
      {
        period: 'Last Week',
        corrective: lastWeekRequests.filter(r => r.type === 'corrective').length,
        preventive: lastWeekRequests.filter(r => r.type === 'preventive').length
      },
      {
        period: 'This Week',
        corrective: thisWeekRequests.filter(r => r.type === 'corrective').length,
        preventive: thisWeekRequests.filter(r => r.type === 'preventive').length
      }
    ];

    res.json({
      maintenanceTrend,
      statusDistribution,
      teamWorkload,
      typeBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const today = new Date();
    const next7Days = subDays(today, -7);

    // Overdue
    const overdue = await MaintenanceRequest.find({
      stage: { $in: ['new', 'in-progress'] },
      scheduledDate: { $lt: today }
    }).populate('equipmentId');

    const overdueList = overdue.map(r => ({
      id: r._id,
      equipment: r.equipmentId?.name || 'Unknown',
      daysOverdue: Math.floor((today - new Date(r.scheduledDate)) / (1000 * 60 * 60 * 24))
    }));

    // Due Soon
    const dueSoon = await MaintenanceRequest.find({
      stage: { $in: ['new', 'in-progress'] },
      scheduledDate: { $gte: today, $lte: next7Days }
    }).populate('equipmentId');

    const dueSoonList = dueSoon.map(r => ({
      id: r._id,
      equipment: r.equipmentId?.name || 'Unknown',
      daysRemaining: Math.floor((new Date(r.scheduledDate) - today) / (1000 * 60 * 60 * 24))
    }));

    // Capacity Warnings
    const members = await TeamMember.find({ isActive: true });
    const activeRequests = await MaintenanceRequest.find({ stage: { $in: ['new', 'in-progress'] } });
    
    const capacityWarnings = members.map(member => {
      const count = activeRequests.filter(r => r.assignedToId?.toString() === member._id.toString()).length;
      return {
        name: member.name,
        assigned: count,
        total: 10,
        percentage: (count / 10) * 100
      };
    }).filter(w => w.percentage >= 80);

    res.json({
      overdue: overdueList,
      dueSoon: dueSoonList,
      capacityWarnings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    // Last 5 maintenance requests completed
    const recentRequests = await MaintenanceRequest.find({ stage: 'repaired' })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('equipmentId');

    // Last 5 equipment added
    const recentEquipment = await Equipment.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Last 5 team changes (using Activity model)
    const recentTeamChanges = await Activity.find({ entityType: 'member' })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      recentRequests,
      recentEquipment,
      recentTeamChanges
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
