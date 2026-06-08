const Equipment = require('../models/Equipment');
const TelemetryData = require('../models/TelemetryData');
const MaintenanceRequest = require('../models/MaintenanceRequest');

const mlAnomalyService = require('../services/mlAnomalyService');

const SIMULATION_INTERVAL_MS = 10000; // Every 10 seconds to not overwhelm the database in dev
// Threshold for ML Anomaly Detection (probability density < epsilon indicates anomaly)
const ML_ANOMALY_THRESHOLD = 1e-5;

// Legacy univariate stats functions removed

let ioRef = null;

const startTelemetryIngest = (io) => {
  ioRef = io;
  console.log('📡 Starting IoT Telemetry Ingestion Pipeline (Runs every 10s)...');
  
  setInterval(async () => {
    try {
      // 1. Fetch active equipment
      const equipments = await Equipment.find({ status: 'active' });
      
      const telemetryDocs = [];
      
      for (const eq of equipments) {
        // Randomly decide if we generate normal data or an anomaly (e.g., 2% chance of anomaly per tick per machine)
        const isAnomaly = Math.random() < 0.02;
        
        // --- TEMPERATURE ---
        const baseTemp = eq.temperatureCelsius || 45; // default fallback
        // Normal variance +/- 2 degrees, anomaly adds 15-25 degrees
        const tempVariance = (Math.random() - 0.5) * 4;
        const tempValue = baseTemp + tempVariance + (isAnomaly ? (15 + Math.random() * 10) : 0);
        
        // --- VIBRATION ---
        const baseVib = eq.vibrationAmplitude || 0.5; // default fallback
        const vibVariance = (Math.random() - 0.5) * 0.2;
        const vibValue = baseVib + vibVariance + (isAnomaly ? (1.5 + Math.random()) : 0);
        
        telemetryDocs.push(
          { metadata: { equipmentId: eq._id, metricType: 'temperature' }, value: tempValue },
          { metadata: { equipmentId: eq._id, metricType: 'vibration' }, value: vibValue }
        );

        // 3. Process ML Multivariate Anomaly Detection
        const features = [tempValue, vibValue];
        const anomalyProb = mlAnomalyService.evaluateTelemetry(eq._id.toString(), features);

        // 4. Action Automation: Check Thresholds
        if (isAnomaly && anomalyProb < ML_ANOMALY_THRESHOLD) {
          await triggerPredictiveAlert(eq, tempValue, vibValue, anomalyProb);
        }
      }

      // 2. Save Telemetry in bulk
      if (telemetryDocs.length > 0) {
        await TelemetryData.insertMany(telemetryDocs);
      }
    } catch (err) {
      console.error('❌ Telemetry Ingestion Error:', err);
    }
  }, SIMULATION_INTERVAL_MS);
};

const triggerPredictiveAlert = async (equipment, tempValue, vibValue, anomalyProb) => {
  // Check if an active predictive alert already exists to prevent spam
  const existingAlert = await MaintenanceRequest.findOne({
    equipmentId: equipment._id,
    type: 'predictive',
    stage: { $nin: ['repaired', 'scrap'] }
  });

  if (existingAlert) return; // Already an active alert

  // Generate a random Request Number
  const requestNumber = `PRD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

  const newRequest = new MaintenanceRequest({
    requestNumber,
    subject: `[ML PREDICTIVE ALERT] Multivariate Anomaly Detected`,
    description: `Machine Learning IoT sensor array detected a statistical anomaly in equipment telemetry.\n\nTemperature: ${tempValue.toFixed(2)}°C \nVibration: ${vibValue.toFixed(2)} mm/s\nML Anomaly Probability Score: ${anomalyProb.toExponential(4)} (Threshold: ${ML_ANOMALY_THRESHOLD})\n\nThe combined vector of telemetry readings represents an abnormal behavioral pattern. Immediate inspection is required.`,
    type: 'predictive',
    stage: 'new',
    priority: 'urgent',
    equipmentId: equipment._id,
    teamId: equipment.maintenanceTeamId,
    assignedToId: equipment.defaultTechnicianId || null,
    scheduledDate: new Date()
  });

  await newRequest.save();

  console.log(`⚠️ ML Predictive Alert Generated for ${equipment.name} (Prob: ${anomalyProb.toExponential(2)})`);

  // Optional: Send Real-Time Socket Notification
  if (ioRef) {
    ioRef.emit('predictive_alert', {
      equipmentName: equipment.name,
      tempValue: tempValue.toFixed(2),
      vibValue: vibValue.toFixed(2),
      anomalyProb: anomalyProb.toExponential(4),
      requestId: newRequest._id
    });
  }
};

module.exports = { startTelemetryIngest };
