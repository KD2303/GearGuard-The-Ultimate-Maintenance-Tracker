const cron = require('node-cron');
const { SparePart } = require('../models');
const PurchaseOrder = require('../models/PurchaseOrder');

const runInventoryCheck = async () => {
  console.log('📦 [Cron] Running inventory check for low-stock parts...');
  try {
    // Find all parts that are in low-stock and haven't been reordered yet
    const lowStockParts = await SparePart.find({ reorderStatus: 'low-stock' });
    
    if (lowStockParts.length === 0) {
      return; // Nothing to do
    }

    console.log(`📦 [Cron] Found ${lowStockParts.length} low-stock parts. Generating draft Purchase Orders...`);

    for (const part of lowStockParts) {
      // Check if a draft or ordered PO already exists for this part
      const existingPO = await PurchaseOrder.findOne({ 
        partId: part._id,
        status: { $in: ['draft', 'ordered'] }
      });

      if (!existingPO) {
        // Calculate a basic quantity to order (e.g. up to 3x the threshold or a fixed amount)
        const quantityNeeded = Math.max(part.minReorderThreshold * 2, 10);
        
        await PurchaseOrder.create({
          partId: part._id,
          quantityNeeded,
          status: 'draft',
          supplierEmail: part.supplierEmail || 'supplier@gearguard.com'
        });

        console.log(`📦 [Cron] Created draft PO for part: ${part.name} (SKU: ${part.sku})`);
      }
    }
  } catch (error) {
    console.error('❌ [Cron] Error running inventory check:', error);
  }
};

// Run every day at midnight (or every minute for testing)
// 0 0 * * * = Midnight daily
// * * * * * = Every minute
const scheduleInventoryCron = () => {
  // We'll run it every 5 minutes in this environment so it's easily verifiable
  cron.schedule('*/5 * * * *', runInventoryCheck);
  console.log('⏱️  [Cron] Inventory check scheduled (every 5 minutes).');
};

module.exports = { scheduleInventoryCron, runInventoryCheck };
