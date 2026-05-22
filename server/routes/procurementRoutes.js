const express = require('express');
const router = express.Router();
const procurementController = require('../controllers/procurementController');

router.get('/forecast', procurementController.getForecast);
router.post('/auto-draft', procurementController.autoDraftPO);

module.exports = router;
