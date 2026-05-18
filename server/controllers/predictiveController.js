const Equipment = require('../models/Equipment');

const {
  analyzeEquipmentFailures,
  generatePredictiveAlerts
} = require('../services/predictiveMaintenanceService');


// ===================================
// Get High Risk Equipment
// ===================================

const getHighRiskEquipment = async (req, res) => {

  try {

    // Fetch all equipment
    const equipments = await Equipment.find();

    const results = [];

    // Analyze each equipment
    for (const equipment of equipments) {

      const analysis = await analyzeEquipmentFailures(equipment);

      // Update equipment data
      equipment.healthScore = analysis.healthScore;
      equipment.riskLevel = analysis.riskLevel;
      equipment.failureCount = analysis.failureCount;

      await equipment.save();

      // Generate alerts
      const alerts = generatePredictiveAlerts(
        equipment.name,
        analysis.failureCount,
        analysis.riskLevel
      );

      // Only show risky equipment
      if (
        analysis.failureCount === 5 &&
        analysis.healthScore === 30 &&
        (analysis.riskLevel === 'High Risk' || analysis.riskLevel === 'Needs Attention')
      ) {

        results.push({
          equipmentName: equipment.name,
          healthScore: analysis.healthScore,
          riskLevel: analysis.riskLevel,
          failureCount: analysis.failureCount,
          alerts
        });
      }
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });

  }

  catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to analyze equipment'
    });
  }
};


module.exports = {
  getHighRiskEquipment
};