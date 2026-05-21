const express = require('express');
const router = express.Router();

const { authorizeRoles } = require('../middleware/role');
const verifyToken = require('../middleware/auth');
const {
  getFloorPlan,
  bulkUpdateEquipmentCoordinates,
} = require('../controllers/mapController');

router.use(verifyToken);

router.get('/floor-plan', getFloorPlan);
router.put('/equipment/coordinates', authorizeRoles('Admin', 'Manager'), bulkUpdateEquipmentCoordinates);

module.exports = router;
