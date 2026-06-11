const express = require('express');
const router = express.Router();
const {
  getHighRiskEquipment,
  getPredictiveStatus,
  simulateTelemetry,
  getDepletionForecast
} = require('../controllers/predictiveController');

router.get('/high-risk', getHighRiskEquipment);
router.get('/status', getPredictiveStatus);
router.get('/depletion-forecast', getDepletionForecast);
router.post('/simulate-telemetry', simulateTelemetry);

module.exports = router;