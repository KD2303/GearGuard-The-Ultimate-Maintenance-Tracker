const MaintenanceRequest = require('../models/MaintenanceRequest');


// ==============================
// Calculate Health Score
// ==============================

const calculateHealthScore = (failureCount, overdueCount, equipmentAgeYears) => {

  let score = 100;

  // Deduct for failures
  score -= failureCount * 10;

  // Deduct for overdue maintenance
  score -= overdueCount * 5;

  // Deduct for old equipment
  score -= equipmentAgeYears * 2;

  // Prevent negative score
  if (score < 0) {
    score = 0;
  }

  return score;
};


// ==============================
// Analyze Equipment Failures
// ==============================

const analyzeEquipmentFailures = async (equipment) => {

  // Fetch all requests for this equipment
  const requests = await MaintenanceRequest.find({
    equipmentId: equipment._id
  });

  // Count failures
  const failureCount = requests.length;

  // Count overdue requests
  const overdueCount = requests.filter(request => {

    return (
      request.status !== 'Repaired' &&
      request.scheduledDate &&
      new Date(request.scheduledDate) < new Date()
    );

  }).length;

  // Equipment age
  let equipmentAgeYears = 0;

  if (equipment.purchaseDate) {

    const ageMs = new Date() - new Date(equipment.purchaseDate);

    equipmentAgeYears = Math.floor(
      ageMs / (1000 * 60 * 60 * 24 * 365)
    );
  }

  // Calculate score
  const healthScore = calculateHealthScore(
    failureCount,
    overdueCount,
    equipmentAgeYears
  );

  // Determine risk level
  let riskLevel = 'Healthy';

  if (healthScore <= 40) {
    riskLevel = 'High Risk';
  }

  else if (healthScore <= 70) {
    riskLevel = 'Needs Attention';
  }

  return {
    healthScore,
    riskLevel,
    failureCount
  };
};


// ==============================
// Generate Predictive Alerts
// ==============================

const generatePredictiveAlerts = (equipmentName, failureCount, riskLevel) => {

  const alerts = [];

  // Repeated failures
  if (failureCount >= 3) {

    alerts.push({
      type: 'Repeated Failures',
      message: `${equipmentName} has frequent maintenance issues.`
    });
  }

  // High risk alert
  if (riskLevel === 'High Risk') {

    alerts.push({
      type: 'High Risk Equipment',
      message: `${equipmentName} may require preventive servicing.`
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