const { MaintenanceRequest } = require('../models');

class PredictionService {
  /**
   * Calculate the probability (0-100) that a maintenance request will breach its SLA.
   * Uses historical data for similar requests (same equipment & type) to estimate completion time.
   * 
   * @param {Object} request - The maintenance request document
   * @returns {Number} probability - 0 to 100
   */
  static async calculateSlaBreachProbability(request) {
    if (!request.createdAt || !request.slaDeadline) {
      return 0; // Can't calculate without dates
    }

    const now = new Date();
    
    // If already breached, it's 100%
    if (now >= request.slaDeadline) {
      return 100;
    }

    // Time variables in milliseconds
    const timeElapsed = now - request.createdAt;
    const totalSlaTime = request.slaDeadline - request.createdAt;
    const timeLeft = request.slaDeadline - now;

    // Simple time elapsed percentage
    const timeElapsedPct = (timeElapsed / totalSlaTime) * 100;

    try {
      // Find historical completed requests of the same type and equipment
      const history = await MaintenanceRequest.find({
        equipmentId: request.equipmentId,
        type: request.type,
        stage: 'repaired',
        completedDate: { $ne: null }
      }).limit(20).lean();

      let averageDurationMs = 0;

      if (history.length > 0) {
        let totalDuration = 0;
        let validCount = 0;
        for (const pastReq of history) {
          const start = pastReq.createdAt;
          const end = pastReq.completedDate;
          if (start && end && end > start) {
            totalDuration += (end - start);
            validCount++;
          }
        }
        if (validCount > 0) {
          averageDurationMs = totalDuration / validCount;
        }
      }

      // If no valid history, fallback to a purely time-based warning system
      if (!averageDurationMs) {
        // Curve the probability to spike heavily after 80% time elapsed
        if (timeElapsedPct < 50) return timeElapsedPct * 0.5;
        if (timeElapsedPct < 80) return timeElapsedPct;
        return Math.min(99, timeElapsedPct * 1.1);
      }

      // We have an expected duration based on history
      const expectedTimeRemaining = averageDurationMs - timeElapsed;

      // If we've already taken longer than the historical average, risk is high
      if (expectedTimeRemaining <= 0) {
        // We are overdue compared to historical average, but haven't breached SLA yet.
        return Math.min(99, 75 + (timeElapsedPct * 0.25)); 
      }

      // How does the expected time remaining compare to the actual SLA time left?
      const riskRatio = expectedTimeRemaining / timeLeft;
      
      // Map ratio to probability
      // ratio 0.5 -> 33%
      // ratio 1.0 -> 50%
      // ratio 2.0 -> 66%
      // We want risk to be higher if ratio > 1 (expected > left)
      let historyProb = (riskRatio / (riskRatio + 1)) * 100;

      // Make it more aggressive if it expects to take longer than left
      if (riskRatio > 1) {
         historyProb = Math.min(99, 50 + (riskRatio * 15));
      }

      // Blend the historical risk with the pure time elapsed risk
      // Weight history heavily if we have it
      return Math.round(Math.max(historyProb, timeElapsedPct));

    } catch (error) {
      console.error('Error calculating SLA prediction:', error);
      // Fallback
      return Math.round(timeElapsedPct);
    }
  }

  /**
   * Batch process open requests and update their probability scores.
   * Returns requests that transitioned to high risk (>85%).
   */
  static async updateAllOpenRequests() {
    const openRequests = await MaintenanceRequest.find({
      stage: { $nin: ['repaired', 'scrap'] },
      slaBreached: false,
      slaDeadline: { $ne: null }
    }).populate('assignedToId', '_id name').populate('createdById', '_id name').populate('equipmentId');

    const highRiskRequests = [];

    for (const request of openRequests) {
      const prob = await this.calculateSlaBreachProbability(request);
      
      // Update if changed significantly to avoid constant DB writes (e.g. > 5% change)
      if (Math.abs(request.slaBreachProbability - prob) > 5 || (prob >= 85 && !request.preBreachWarningSent)) {
        request.slaBreachProbability = prob;
        
        if (prob >= 85 && !request.preBreachWarningSent) {
          highRiskRequests.push(request);
          // Don't mark sent here, let the caller (slaChecker) do it after actual notification
        }

        await request.save();
      }
    }

    return highRiskRequests;
  }
}

module.exports = PredictionService;
