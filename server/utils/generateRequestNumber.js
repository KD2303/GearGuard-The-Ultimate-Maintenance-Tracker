const { MaintenanceRequest } = require('../models');

/**
 * Generates a unique request number in the format REQ-YYYYMM-XXXX
 */
const generateRequestNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  const regex = new RegExp(`^REQ-${year}${month}-`);
  const lastRequest = await MaintenanceRequest.findOne({
    requestNumber: { $regex: regex },
  }).sort({ requestNumber: -1 });

  let sequence = 1;
  if (lastRequest && lastRequest.requestNumber) {
    const parts = lastRequest.requestNumber.split("-");
    const lastSequence = parseInt(parts[2] || "0", 10);
    if (!isNaN(lastSequence)) sequence = lastSequence + 1;
  }

  return `REQ-${year}${month}-${String(sequence).padStart(4, "0")}`;
};

module.exports = generateRequestNumber;
