const { Counter } = require('../models');

/**
 * Generates a unique request number in the format REQ-YYYYMM-XXXX atomically
 */
const generateRequestNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const monthKey = `REQ-${year}${month}`;

  // Atomic increment with upsert
  const counter = await Counter.findByIdAndUpdate(
    monthKey,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const sequence = counter.seq;
  return `${monthKey}-${String(sequence).padStart(4, "0")}`;
};

module.exports = generateRequestNumber;
