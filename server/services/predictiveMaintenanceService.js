const { MaintenanceRequest, Equipment } = require('../models');
const { logActivity } = require('../utils/logActivity');
const NotificationService = require('./notificationService');

// ==============================
// Generate Request Number Helper
// ==============================
const generateRequestNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  const regex = new RegExp(`^REQ-${year}${month}-`);
  const lastRequest = await MaintenanceRequest.findOne({
    requestNumber: { $regex: regex },
  }).sort({ requestNumber: -1 });

  let sequence = 1;
  if (lastRequest && lastRequest.requestNumber) {
    const parts = lastRequest.requestNumber.split("-");
    const lastSequence = parseInt(parts[2] || "0", 10);
    if (!isNaN(lastSequence)) sequence = lastSequence + 1;
  }

  return `REQ-${year}${month}-${String(sequence).padStart(4, "0")}`;
};

// ==============================
// Calculate Health Score
// ==============================
const calculateHealthScore = (equipment) => {
  const hours = equipment.operatingHours || 0;
  const temp = equipment.temperatureCelsius || 25;
  const vib = equipment.vibrationAmplitude || 0.1;

  const thresholds = equipment.criticalThresholds || {};
  const maxHours = thresholds.maxHours || 2000;
  const maxTemp = thresholds.maxTemp || 85;
  const maxVibration = thresholds.maxVibration || 4.5;

  const hoursPenalty = Math.max(0, (hours / maxHours) * 30);
  const tempPenalty = Math.max(0, (temp / maxTemp) * 35);
  const vibrationPenalty = Math.max(0, (vib / maxVibration) * 35);

  let score = 100 - (hoursPenalty + tempPenalty + vibrationPenalty);
  score = Math.max(0, Math.min(100, score));

  return Math.round(score);
};

// ==============================
// Analyze Equipment Failures
// ==============================
const analyzeEquipmentFailures = async (equipment, io) => {
  const healthScore = calculateHealthScore(equipment);

  let riskLevel = 'Healthy';
  if (healthScore <= 40) {
    riskLevel = 'High Risk';
  } else if (healthScore <= 70) {
    riskLevel = 'Needs Attention';
  }

  // Count total failure/service occurrences
  const requests = await MaintenanceRequest.find({ equipmentId: equipment._id });
  const failureCount = requests.length;

  equipment.healthScore = healthScore;
  equipment.riskLevel = riskLevel;
  equipment.failureCount = failureCount;
  await equipment.save();

  // Dispatch work order if health score is critical
  let autoDispatchedRequest = null;
  if (healthScore <= 40) {
    const openRequest = await MaintenanceRequest.findOne({
      equipmentId: equipment._id,
      stage: { $in: ['new', 'in-progress'] }
    });

    if (!openRequest) {
      const requestNumber = await generateRequestNumber();
      autoDispatchedRequest = await MaintenanceRequest.create({
        requestNumber,
        subject: `[Auto-Dispatch] Preemptive Service Required for ${equipment.name}`,
        description: `AUTOMATED PREDICTIVE DISPATCH: ${equipment.name} health score has dropped to critical (${healthScore}%).\n\nReal-time Telemetry Metrics:\n- Running Time: ${equipment.operatingHours} hrs (Threshold: ${equipment.criticalThresholds?.maxHours || 2000} hrs)\n- Temperature: ${equipment.temperatureCelsius}°C (Threshold: ${equipment.criticalThresholds?.maxTemp || 85}°C)\n- Vibration: ${equipment.vibrationAmplitude} mm/s (Threshold: ${equipment.criticalThresholds?.maxVibration || 4.5} mm/s)`,
        type: 'preventive',
        stage: 'new',
        priority: 'urgent',
        equipmentId: equipment._id,
        teamId: equipment.maintenanceTeamId,
        assignedToId: equipment.defaultTechnicianId,
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      // Update equipment status to under-maintenance
      equipment.status = 'under-maintenance';
      await equipment.save();

      // Log system activity
      await logActivity({
        type: 'request_created',
        title: 'Preemptive Work Order Auto-Dispatched',
        description: `${equipment.name} - Automated ticket ${requestNumber} dispatched due to critical health (${healthScore}%)`,
        userName: 'GearGuard System',
        metadata: {
          healthScore,
          priority: 'urgent',
          requestNumber
        },
        entityType: 'request',
        entityId: String(autoDispatchedRequest._id)
      });

      // Emit WebSocket alerts
      if (io) {
        const populatedRequest = await MaintenanceRequest.findById(autoDispatchedRequest._id)
          .populate('equipment')
          .populate('team')
          .populate('assignedTo', 'name email');

        await NotificationService.notifyRequestChange(io, 'request_created', populatedRequest);

        await NotificationService.sendNotification(io, {
          type: 'alert',
          message: `🚨 Critical Alert: Automated work order dispatched for ${equipment.name} (${healthScore}% health)!`,
          requestId: autoDispatchedRequest._id,
          priority: 'high'
        });
      }
    }
  }

  return {
    healthScore,
    riskLevel,
    failureCount,
    autoDispatched: !!autoDispatchedRequest,
    dispatchedRequest: autoDispatchedRequest
  };
};

// ==============================
// Generate Predictive Alerts
// ==============================
const generatePredictiveAlerts = (equipmentName, failureCount, riskLevel, healthScore = 100) => {
  const alerts = [];

  if (healthScore <= 40) {
    alerts.push({
      type: 'Critical Health Score',
      message: `${equipmentName} is operating at critical levels (${healthScore}% health). Preemptive service recommended.`
    });
  } else if (healthScore <= 70) {
    alerts.push({
      type: 'Needs Maintenance Attention',
      message: `${equipmentName} is showing signs of degradation (${healthScore}% health).`
    });
  }

  if (failureCount >= 3) {
    alerts.push({
      type: 'Frequent Downtime Warning',
      message: `${equipmentName} has logged frequent breakdown events (${failureCount} total).`
    });
  }

  return alerts;
};

// ==============================
// Export Functions
// ==============================
module.exports = {
  calculateHealthScore,
  analyzeEquipmentFailures,
  generatePredictiveAlerts
};