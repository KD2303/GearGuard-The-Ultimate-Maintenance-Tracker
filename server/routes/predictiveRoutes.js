const express = require('express');
const router = express.Router();
const {
  getHighRiskEquipment,
  getPredictiveStatus,
  simulateTelemetry
} = require('../controllers/predictiveController');

router.get('/high-risk', getHighRiskEquipment);
router.get('/status', getPredictiveStatus);
router.post('/simulate-telemetry', simulateTelemetry);

module.exports = router;