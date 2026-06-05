import api from './api';
import { ShiftHandover } from '../types';

export const shiftHandoverService = {
  getAll: async (): Promise<ShiftHandover[]> => {
    const response = await api.get('/shift-handovers');
    return response.data;
  },

  create: async (data: Partial<ShiftHandover>): Promise<ShiftHandover> => {
    const response = await api.post('/shift-handovers', data);
    return response.data;
  },

  acknowledge: async (id: string): Promise<ShiftHandover> => {
    const response = await api.post(`/shift-handovers/${id}/acknowledge`);
    return response.data;
  }
};
