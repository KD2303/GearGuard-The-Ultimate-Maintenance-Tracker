const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/', inventoryController.getAllParts);
router.get('/:id', inventoryController.getPartById);
router.post('/', inventoryController.createPart);
router.put('/:id', inventoryController.updatePart);
router.delete('/:id', inventoryController.deletePart);
router.post('/:id/reorder', inventoryController.reorderPart);

module.exports = router;
