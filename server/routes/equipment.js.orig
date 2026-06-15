const express = require('express');
const router = express.Router();

const protect = require('../middleware/auth');
const { authorizeRoles } = require("../middleware/role");
const { validate } = require('../middleware/validation');
const {
  createEquipmentRules,
  updateEquipmentRules,
} = require('../validators/equipmentValidator');

const equipmentController = require('../controllers/equipmentController');

// Apply protection to all routes below
router.use(protect);

// GET all equipment (any logged-in user)
router.get('/', equipmentController.getAllEquipment);

// GET equipment compatible with a specific part
router.get('/compatible-with-part/:partId', equipmentController.getEquipmentByCompatiblePart);

// GET equipment financials (Admin + Manager)
router.get('/financials', authorizeRoles("Admin", "Manager"), equipmentController.getEquipmentFinancials);

// GET single equipment
router.get('/:id', equipmentController.getEquipmentById);

// GET maintenance history
router.get('/:id/maintenance', equipmentController.getEquipmentMaintenanceHistory);

// CREATE (Admin + Manager only)
router.post(
  '/',
  authorizeRoles("Admin", "Manager"),
  createEquipmentRules,
  validate,
  equipmentController.createEquipment
);

// UPDATE (Admin + Manager)
router.put(
  '/:id',
  authorizeRoles("Admin", "Manager"),
  updateEquipmentRules,
  validate,
  equipmentController.updateEquipment
);

// DELETE (Admin only)
router.delete(
  '/:id',
  authorizeRoles("Admin"),
  equipmentController.deleteEquipment
);

module.exports = router;