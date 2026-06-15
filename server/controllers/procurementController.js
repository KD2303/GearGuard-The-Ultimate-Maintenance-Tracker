const { MaintenanceRequest, SparePart, PurchaseOrder, Supplier, PreventiveSchedule, Equipment } = require('../models');
const { ErrorHandler, ERROR_TYPES } = require('../utils/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');

const calculateProjectedDemand = async () => {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const now = new Date();

  const demandMap = {}; // partId -> { demand, part }

  // 1. Demand from open MaintenanceRequests
  const upcomingRequests = await MaintenanceRequest.find({
    stage: { $nin: ['repaired', 'scrap'] },
    $or: [
      { scheduledDate: { $lte: thirtyDaysFromNow } },
      { type: 'corrective' } // include all open corrective requests
    ],
    'partsUsed.0': { $exists: true }
  }).populate('partsUsed.partId');

  upcomingRequests.forEach(req => {
    req.partsUsed.forEach(pu => {
      if (pu.partId) {
        const id = String(pu.partId._id || pu.partId);
        if (!demandMap[id]) {
          demandMap[id] = { demand: 0, part: pu.partId };
        }
        demandMap[id].demand += pu.quantityUsed;
      }
    });
  });

  // 2. Predictive Demand from PreventiveSchedule
  const activeSchedules = await PreventiveSchedule.find({
    isActive: true,
    nextRunAt: { $lte: thirtyDaysFromNow }
  }).populate({
    path: 'equipmentId',
    populate: { path: 'compatibleParts' } // populate the parts themselves so we have the part objects
  });

  activeSchedules.forEach(schedule => {
    if (!schedule.equipmentId || !schedule.equipmentId.compatibleParts || schedule.equipmentId.compatibleParts.length === 0) {
      return;
    }

    // Calculate how many times it runs in the next 30 days
    let runCount = 0;
    let currentRunDate = new Date(schedule.nextRunAt);
    
    while (currentRunDate <= thirtyDaysFromNow) {
      runCount++;
      
      if (schedule.frequency === 'daily') {
        currentRunDate.setDate(currentRunDate.getDate() + 1);
      } else if (schedule.frequency === 'weekly') {
        currentRunDate.setDate(currentRunDate.getDate() + 7);
      } else if (schedule.frequency === 'monthly') {
        currentRunDate.setMonth(currentRunDate.getMonth() + 1);
      } else if (schedule.frequency === 'custom' && schedule.intervalDays) {
        currentRunDate.setDate(currentRunDate.getDate() + schedule.intervalDays);
      } else {
        break; // safety break
      }
    }

    if (runCount > 0) {
      schedule.equipmentId.compatibleParts.forEach(part => {
        if (part) {
          const id = String(part._id);
          if (!demandMap[id]) {
            demandMap[id] = { demand: 0, part: part };
          }
          // Assuming 1 of each compatible part is consumed per PM run
          demandMap[id].demand += runCount;
        }
      });
    }
  });

  return demandMap;
};

// Get 30-day inventory demand forecast
exports.getForecast = asyncHandler(async (req, res, next) => {
  const demandMap = await calculateProjectedDemand();

  // 3. Compare with stock and identify shortages
  const shortages = [];
  for (const key in demandMap) {
    const { demand, part } = demandMap[key];
    const projectedStock = part.quantityInStock - demand;
    
    // We want to reorder if projected stock falls below the min threshold
    if (projectedStock <= part.minReorderThreshold) {
      const quantityToOrder = Math.max(
        part.minReorderThreshold - projectedStock + 5, // Order enough to get back above threshold + buffer
        5 // minimum order quantity
      );
      shortages.push({
        partId: part._id,
        name: part.name,
        sku: part.sku,
        supplierId: part.supplierId,
        currentStock: part.quantityInStock,
        projectedDemand: demand,
        projectedStock: projectedStock,
        minReorderThreshold: part.minReorderThreshold,
        suggestedOrderQuantity: quantityToOrder,
        unitCost: part.unitCost
      });
    }
  }

  res.status(200).json(shortages);
});

// Auto-draft POs based on shortages
exports.autoDraftPO = asyncHandler(async (req, res, next) => {
  const demandMap = await calculateProjectedDemand();

  const shortagesBySupplier = {}; // supplierId -> array of items

  for (const key in demandMap) {
    const { demand, part } = demandMap[key];
    const projectedStock = part.quantityInStock - demand;
    
    if (projectedStock <= part.minReorderThreshold && part.supplierId) {
      const quantityToOrder = Math.max(part.minReorderThreshold - projectedStock + 5, 5);
      const sId = String(part.supplierId);
      if (!shortagesBySupplier[sId]) {
        shortagesBySupplier[sId] = [];
      }
      shortagesBySupplier[sId].push({
        partId: part._id,
        quantityNeeded: quantityToOrder,
        unitCost: part.unitCost || 0
      });
    }
  }

  const createdDrafts = [];
  for (const sId in shortagesBySupplier) {
    const items = shortagesBySupplier[sId];
    
    // Check if there is already a draft PO for this supplier to avoid duplicates
    const existingDraft = await PurchaseOrder.findOne({ supplierId: sId, status: 'draft' });
    if (existingDraft) {
      // For simplicity, we just skip if a draft exists. 
      continue; 
    }

    let totalCost = 0;
    items.forEach(item => { totalCost += (item.quantityNeeded * item.unitCost); });

    const poNumber = 'PO-' + Math.floor(100000 + Math.random() * 900000); // 6 digit random
    const newPO = await PurchaseOrder.create({
      poNumber,
      supplierId: sId,
      items,
      totalCost,
      status: 'draft'
    });
    createdDrafts.push(newPO);
  }

  res.status(200).json({ success: true, draftsCreated: createdDrafts.length, drafts: createdDrafts });
});
