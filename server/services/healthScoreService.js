const { Equipment, MaintenanceRequest } = require('../models');

async function calculateAndUpdateHealthScore(equipmentId) {
  try {
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) return null;

    let score = 100;
    const breakdown = [];

    // 1. Age Penalty: -1 point for every 6 months of age
    if (equipment.purchaseDate) {
      const purchaseDate = new Date(equipment.purchaseDate);
      const now = new Date();
      const monthsDiff = (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth());
      if (monthsDiff > 0) {
        const agePenalty = Math.floor(monthsDiff / 6);
        if (agePenalty > 0) {
          score -= agePenalty;
          breakdown.push({ factor: 'Age Penalty', deduction: agePenalty });
        }
      }
    }

    // 2. Breakdown Penalty: -10 points for every corrective ticket opened in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentBreakdowns = await MaintenanceRequest.countDocuments({
      equipmentId: equipment._id,
      type: 'corrective',
      createdAt: { $gte: thirtyDaysAgo }
    });
    if (recentBreakdowns > 0) {
      const deduction = recentBreakdowns * 10;
      score -= deduction;
      breakdown.push({ factor: 'Recent Breakdowns', deduction });
    }

    // 3. Overdue Penalty: -15 points for every open ticket that is currently overdue
    const openStages = ['new', 'in-progress'];
    const overdueTickets = await MaintenanceRequest.countDocuments({
      equipmentId: equipment._id,
      stage: { $in: openStages },
      scheduledDate: { $lt: new Date() }
    });
    if (overdueTickets > 0) {
      const deduction = overdueTickets * 15;
      score -= deduction;
      breakdown.push({ factor: 'Overdue Tickets', deduction });
    }

    // 4. Floor the score at 0
    score = Math.max(0, score);

    // Always update breakdown, and update score if changed
    let updated = false;
    
    if (equipment.healthScore !== score) {
      equipment.healthScore = score;
      updated = true;
      
      // Optionally update riskLevel based on score
      if (score >= 75) {
        equipment.riskLevel = 'Healthy';
      } else if (score >= 40) {
        equipment.riskLevel = 'At Risk';
      } else {
        equipment.riskLevel = 'Critical';
      }
    }

    // Checking if breakdown changed is trickier, so we just update it
    // Mongoose handles modified checking
    equipment.healthScoreBreakdown = breakdown;
    await equipment.save();

    return score;
  } catch (error) {
    console.error(`Failed to update health score for equipment ${equipmentId}:`, error);
    return null;
  }
}

async function recalculateAllHealthScores() {
  try {
    const equipments = await Equipment.find({ status: { $in: ['active', 'under-maintenance'] } });
    let count = 0;
    for (const eq of equipments) {
      await calculateAndUpdateHealthScore(eq._id);
      count++;
    }
    console.log(`[HealthScoreService] Recalculated health scores for ${count} active equipment.`);
  } catch (error) {
    console.error('[HealthScoreService] Failed to recalculate health scores:', error);
  }
}

module.exports = {
  calculateAndUpdateHealthScore,
  recalculateAllHealthScores
};
