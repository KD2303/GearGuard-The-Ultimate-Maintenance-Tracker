const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MaintenanceRequest = require('../models/MaintenanceRequest');

router.post('/batch', auth, async (req, res, next) => {
  try {
    const { actions } = req.body;
    if (!actions || !Array.isArray(actions)) {
      return res.status(400).json({ success: false, error: 'Invalid payload' });
    }

    const results = [];

    // Process sequentially to avoid race conditions, or could use Promise.all
    for (const action of actions) {
      try {
        // Very basic routing of the batched actions. 
        // In a real app, this would dynamically route to controllers or have a dedicated SyncController.
        
        // Example: Intercepting a PUT to /api/requests/:id
        if (action.method === 'PUT' && action.url.includes('/api/requests/')) {
          const requestId = action.url.split('/').pop();
          const updateData = action.payload;

          const existingRequest = await MaintenanceRequest.findById(requestId);
          if (!existingRequest) {
            results.push({ id: action.id, status: 'failed', reason: 'Not found' });
            continue;
          }

          // Conflict resolution logic:
          // Example: Last Write Wins, or check if existingRequest has been modified since the offline action was created.
          // For now, we apply the update directly.
          await MaintenanceRequest.findByIdAndUpdate(requestId, updateData, { new: true });
          
          results.push({ id: action.id, status: 'success' });
        } else {
          // Unhandled route
          results.push({ id: action.id, status: 'ignored', reason: 'Unhandled route' });
        }
      } catch (err) {
        console.error('Error processing offline action:', err);
        results.push({ id: action.id, status: 'failed', reason: err.message });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Batch processed',
      results
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
