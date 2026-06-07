const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const protect = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');
const upload = require('../middleware/upload');
const magicByteValidator = require('../middleware/magicByteValidator');

router.use(protect);

router.get('/', requestController.getAllRequests);
router.get('/calendar', requestController.getCalendarEvents);
router.get('/:id', requestController.getRequestById);
router.post('/', requestController.createRequest);
router.put('/:id', requestController.updateRequest);
router.patch('/:id/stage', requestController.updateRequestStage);
router.post('/:id/comments', requestController.addComment);
router.delete('/:id/comments/:commentId', requestController.deleteComment);
router.post('/:id/smart-assign', requestController.smartAssignRequest);
router.get('/:id/predictions', requestController.predictSpareParts);
router.post('/:id/parts', requestController.addPartToRequest);
router.post('/:id/escalate', authorizeRoles('Admin', 'Manager'), requestController.escalateToVendor);
router.post('/:id/approve', authorizeRoles('Admin', 'Manager'), requestController.approveRequest);
router.post('/:id/reject', authorizeRoles('Admin', 'Manager'), requestController.rejectRequest);
router.delete('/:id', authorizeRoles('Admin', 'Manager'), requestController.deleteRequest);
router.post('/:id/loto', requestController.submitLOTO);
router.post('/:id/tools/checkout', requestController.checkoutTool);
router.post('/:id/tools/return', requestController.returnTool);

// Attachments
router.post('/:id/attachments', upload.array('attachments', 5), magicByteValidator, requestController.uploadAttachments);
router.get('/:id/attachments', requestController.listAttachments);
router.get('/:id/attachments/:attachmentId', requestController.downloadAttachment);
router.delete('/:id/attachments/:attachmentId', requestController.deleteAttachment);


module.exports = router;
