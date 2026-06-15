const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const upload = require('../middleware/upload');
const magicByteValidator = require('../middleware/magicByteValidator');

// All vendor routes are protected by the magic token in the URL params
router.use('/ticket/:token', vendorController.authenticateVendorToken);

router.get('/ticket/:token', vendorController.getVendorTicket);
router.post('/ticket/:token/notes', vendorController.addVendorNote);
router.patch('/ticket/:token/stage', vendorController.updateVendorStage);

// Attachments
router.post('/ticket/:token/attachments', upload.array('attachments', 5), magicByteValidator, vendorController.uploadVendorAttachments);

module.exports = router;
