const express = require('express');
const router = express.Router();

const { verifyToken } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/role");

const equipmentController = require('../controllers/equipmentController');

// GET all equipment (any logged-in user)
router.get('/', verifyToken, equipmentController.getAllEquipment);

// GET single equipment
router.get('/:id', verifyToken, equipmentController.getEquipmentById);

// GET maintenance history
router.get('/:id/maintenance', verifyToken, equipmentController.getEquipmentMaintenanceHistory);

// CREATE (Admin + Manager only)
router.post(
  '/',
  verifyToken,
  authorizeRoles("Admin", "Manager"),
  equipmentController.createEquipment
);

// UPDATE (Admin + Manager)
router.put(
  '/:id',
  verifyToken,
  authorizeRoles("Admin", "Manager"),
  equipmentController.updateEquipment
);

// DELETE (Admin only)
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles("Admin"),
  equipmentController.deleteEquipment
);

module.exports = router;