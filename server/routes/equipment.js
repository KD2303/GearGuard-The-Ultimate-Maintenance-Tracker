const express = require('express');
const router = express.Router();

const protect = require('../middleware/auth');
const { authorizeRoles } = require("../middleware/role");

const equipmentController = require('../controllers/equipmentController');

// Apply protection to all routes below
router.use(protect);

// GET all equipment (any logged-in user)
router.get('/', equipmentController.getAllEquipment);

// GET single equipment
router.get('/:id', equipmentController.getEquipmentById);

// GET maintenance history
router.get('/:id/maintenance', equipmentController.getEquipmentMaintenanceHistory);

// CREATE (Admin + Manager only)
router.post(
  '/',
  authorizeRoles("Admin", "Manager"),
  equipmentController.createEquipment
);

// UPDATE (Admin + Manager)
router.put(
  '/:id',
  authorizeRoles("Admin", "Manager"),
  equipmentController.updateEquipment
);

// DELETE (Admin only)
router.delete(
  '/:id',
  authorizeRoles("Admin"),
  equipmentController.deleteEquipment
);

module.exports = router;