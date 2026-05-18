const express = require('express');

const router = express.Router();

const {
  getHighRiskEquipment
} = require('../controllers/predictiveController');


router.get('/high-risk', getHighRiskEquipment);


module.exports = router;