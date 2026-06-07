export const CERTIFICATIONS_LIST = [
  'High Voltage',
  'Hydraulics Level 2',
  'Welding',
  'Forklift Operator',
  'PLC Programming',
  'HVAC Technician',
  'Pneumatics',
  'CNC Machining',
  'Robotics Maintenance',
  'Heavy Machinery Operation'
];

export const CERTIFICATION_OPTIONS = CERTIFICATIONS_LIST.map(cert => ({
  value: cert,
  label: cert
}));
