const express = require('express');
const router = express.Router();

const { authorizeRoles } = require('../middleware/role');
const verifyToken = require('../middleware/auth');
const {
  getFloorPlan,
  bulkUpdateEquipmentCoordinates,
  getDowntimeHeatmap
} = require('../controllers/mapController');

router.use(verifyToken);

router.get('/floor-plan', getFloorPlan);
router.put('/equipment/coordinates', authorizeRoles('Admin', 'Manager'), bulkUpdateEquipmentCoordinates);
router.get('/downtime-heatmap', getDowntimeHeatmap);

module.exports = router;
