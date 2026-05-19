import api from './api';

export interface TelemetrySimulationDto {
  equipmentId: string;
  operatingHours?: number;
  temperatureCelsius?: number;
  vibrationAmplitude?: number;
}

export interface PredictiveEquipmentStatus {
  id: string;
  name: string;
  category: string;
  location: string;
  healthScore: number;
  riskLevel: string;
  failureCount: number;
  operatingHours: number;
  temperatureCelsius: number;
  vibrationAmplitude: number;
  criticalThresholds: {
    maxHours: number;
    maxTemp: number;
    maxVibration: number;
  };
  status: string;
  alerts: Array<{
    type: string;
    message: string;
  }>;
  autoDispatched?: boolean;
  dispatchedRequest?: {
    requestNumber: string;
    _id: string;
  };
}

export const getHighRiskEquipment = async () => {
  const response = await api.get('/predictive/high-risk');
  return response.data;
};

export const getPredictiveStatus = async (): Promise<PredictiveEquipmentStatus[]> => {
  const response = await api.get('/predictive/status');
  return response.data.data || response.data;
};

export const simulateTelemetry = async (data: TelemetrySimulationDto): Promise<PredictiveEquipmentStatus> => {
  const response = await api.post('/predictive/simulate-telemetry', data);
  return response.data.data || response.data;
};