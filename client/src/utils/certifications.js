"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CERTIFICATION_OPTIONS = exports.CERTIFICATIONS_LIST = void 0;
exports.CERTIFICATIONS_LIST = [
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
exports.CERTIFICATION_OPTIONS = exports.CERTIFICATIONS_LIST.map(function (cert) { return ({
    value: cert,
    label: cert
}); });
