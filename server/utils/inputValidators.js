const validateSerialNumber = (serial) => {
  if (!serial || typeof serial !== 'string') return false;
  const regex = /^[A-Z0-9\-]{3,50}$/;
  return regex.test(serial.trim());
};

const validateAssetCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  const regex = /^[A-Z]{2}[0-9]{6}$/;
  return regex.test(code.trim());
};

const validateEquipmentName = (name) => {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 3 && trimmed.length <= 100 && !/[<>"']/g.test(trimmed);
};

const validateLocation = (location) => {
  if (!location || typeof location !== 'string') return false;
  const trimmed = location.trim();
  return trimmed.length >= 2 && trimmed.length <= 100 && !/[<>"']/g.test(trimmed);
};

const validateManufacturer = (manufacturer) => {
  if (!manufacturer || typeof manufacturer !== 'string') return false;
  const trimmed = manufacturer.trim();
  return trimmed.length >= 2 && trimmed.length <= 100 && !/[<>"']/g.test(trimmed);
};

const validateModel = (model) => {
  if (!model || typeof model !== 'string') return false;
  const trimmed = model.trim();
  return trimmed.length >= 1 && trimmed.length <= 100 && !/[<>"']/g.test(trimmed);
};

const validateCost = (cost) => {
  const num = Number(cost);
  return Number.isFinite(num) && num >= 0 && num <= 999999999;
};

const validateYearOfManufacture = (year) => {
  const num = Number(year);
  return Number.isInteger(num) && num >= 1900 && num <= new Date().getFullYear();
};

const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

module.exports = {
  validateSerialNumber,
  validateAssetCode,
  validateEquipmentName,
  validateLocation,
  validateManufacturer,
  validateModel,
  validateCost,
  validateYearOfManufacture,
  validateEmail,
};
