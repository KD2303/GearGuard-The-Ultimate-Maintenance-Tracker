const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const protect = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// Note: Ensure users accessing webhooks are Admins, if requested. 
// Assuming Admin role is required for global settings.
router.use(protect);
router.use(roleGuard('Admin'));

router.route('/')
  .get(webhookController.getWebhooks)
  .post(webhookController.createWebhook);

router.route('/test')
  .post(webhookController.testWebhook);

router.route('/dlq/failed')
  .get(webhookController.getDlq);

router.route('/dlq/:id/replay')
  .post(webhookController.replayDlqEvent);

router.route('/:id')
  .put(webhookController.updateWebhook)
  .delete(webhookController.deleteWebhook);

module.exports = router;
