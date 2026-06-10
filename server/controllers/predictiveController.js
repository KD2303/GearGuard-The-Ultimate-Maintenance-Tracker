const Equipment = require('../models/Equipment');
const { ErrorHandler, ERROR_TYPES } = require('../utils/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  analyzeEquipmentFailures,
  generatePredictiveAlerts
} = require('../services/predictiveMaintenanceService');
const mlAnomalyService = require('../services/mlAnomalyService');

// ===================================
// Get High Risk Equipment
// ===================================
const getHighRiskEquipment = asyncHandler(async (req, res) => {
  const equipments = await Equipment.find();
  const results = [];
  const io = req.app.get("socketio");

  for (const equipment of equipments) {
    const analysis = await analyzeEquipmentFailures(equipment, io);
    const alerts = generatePredictiveAlerts(
      equipment.name,
      analysis.failureCount,
      analysis.riskLevel,
      analysis.healthScore
    );

    if (analysis.riskLevel === 'High Risk' || analysis.riskLevel === 'Needs Attention') {
      results.push({
        id: equipment._id,
        equipmentName: equipment.name,
        healthScore: analysis.healthScore,
        riskLevel: analysis.riskLevel,
        failureCount: analysis.failureCount,
        alerts
      });
    }
  }

  res.status(200).json({
    success: true,
    count: results.length,
    data: results
  });
});

// ===================================
// Get All Predictive Statuses
// ===================================
const getPredictiveStatus = asyncHandler(async (req, res) => {
  const equipments = await Equipment.find();
  const results = [];
  const io = req.app.get("socketio");

  for (const equipment of equipments) {
    const analysis = await analyzeEquipmentFailures(equipment, io);
    const alerts = generatePredictiveAlerts(
      equipment.name,
      analysis.failureCount,
      analysis.riskLevel,
      analysis.healthScore
    );

    results.push({
      id: equipment._id,
      name: equipment.name,
      category: equipment.category,
      location: equipment.location,
      healthScore: analysis.healthScore,
      riskLevel: analysis.riskLevel,
      failureCount: analysis.failureCount,
      operatingHours: equipment.operatingHours,
      temperatureCelsius: equipment.temperatureCelsius,
      vibrationAmplitude: equipment.vibrationAmplitude,
      criticalThresholds: equipment.criticalThresholds || {
        maxHours: 2000,
        maxTemp: 85,
        maxVibration: 4.5
      },
      status: equipment.status,
      alerts
    });
  }

  res.status(200).json({
    success: true,
    count: results.length,
    data: results
  });
});

// ===================================
// Simulate Telemetry Values
// ===================================
const simulateTelemetry = asyncHandler(async (req, res) => {
  const { equipmentId, operatingHours, temperatureCelsius, vibrationAmplitude } = req.body;

  if (!equipmentId) {
    throw new ErrorHandler("Equipment ID is required", ERROR_TYPES.VALIDATION_ERROR);
  }

  const equipment = await Equipment.findById(equipmentId);

  if (!equipment) {
    throw new ErrorHandler("Equipment not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  if (operatingHours !== undefined) equipment.operatingHours = Number(operatingHours);
  if (temperatureCelsius !== undefined) equipment.temperatureCelsius = Number(temperatureCelsius);
  if (vibrationAmplitude !== undefined) equipment.vibrationAmplitude = Number(vibrationAmplitude);

  await equipment.save();

  const io = req.app.get("socketio");
  const analysis = await analyzeEquipmentFailures(equipment, io);
  const alerts = generatePredictiveAlerts(
    equipment.name,
    analysis.failureCount,
    analysis.riskLevel,
    analysis.healthScore
  );

  // Calculate ML Anomaly Probability for the simulated values
  const features = [equipment.temperatureCelsius, equipment.vibrationAmplitude];
  const anomalyProb = mlAnomalyService.evaluateTelemetry(equipment._id.toString(), features);

  const updatedResult = {
    id: equipment._id,
    name: equipment.name,
    category: equipment.category,
    location: equipment.location,
    healthScore: analysis.healthScore,
    riskLevel: analysis.riskLevel,
    failureCount: analysis.failureCount,
    operatingHours: equipment.operatingHours,
    temperatureCelsius: equipment.temperatureCelsius,
    vibrationAmplitude: equipment.vibrationAmplitude,
    criticalThresholds: equipment.criticalThresholds || {
      maxHours: 2000,
      maxTemp: 85,
      maxVibration: 4.5
    },
    status: equipment.status,
    alerts,
    autoDispatched: analysis.autoDispatched,
    dispatchedRequest: analysis.dispatchedRequest,
    anomalyProb
  };

  // Broadcast telemetry update via socket
  if (io) {
    io.emit("predictive:telemetry_updated", updatedResult);
  }

  res.status(200).json({
    success: true,
    message: "Telemetry simulated successfully",
    data: updatedResult
  });
});

module.exports = {
  getHighRiskEquipment,
  getPredictiveStatus,
  simulateTelemetry
};