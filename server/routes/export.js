const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  exportEquipmentExcel,
  exportRequestsExcel,
  exportEquipmentPDF,
} = require('../controllers/exportController');

router.use(protect);

router.get('/equipment', exportEquipmentExcel);
router.get('/requests', exportRequestsExcel);
router.get('/equipment/:id/pdf', exportEquipmentPDF);

module.exports = router;
