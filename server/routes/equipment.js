const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/', equipmentController.getAllEquipment);
router.get('/:id', equipmentController.getEquipmentById);
router.get('/:id/maintenance', equipmentController.getEquipmentMaintenanceHistory);
router.post('/', equipmentController.createEquipment);
router.put('/:id', equipmentController.updateEquipment);
router.delete('/:id', equipmentController.deleteEquipment);

module.exports = router;
