import api from './api';
import { MaintenanceRequest, CreateMaintenanceRequestDto, RequestFilters } from '../types';

export const requestService = {
  getAll: async (filters?: { stage?: string; type?: string; teamId?: string }): Promise<MaintenanceRequest[]> => {
    const response = await api.get('/requests', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<MaintenanceRequest> => {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },

  create: async (data: CreateMaintenanceRequestDto): Promise<MaintenanceRequest> => {
    const response = await api.post('/requests', data);
    return response.data;
  },

  update: async (id: string, data: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> => {
    const response = await api.put(`/requests/${id}`, data);
    return response.data;
  },

  updateStage: async (id: string, stage: string): Promise<MaintenanceRequest> => {
    const response = await api.patch(`/requests/${id}/stage`, { stage });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/requests/${id}`);
  },

  getCalendarEvents: async (start?: string, end?: string): Promise<MaintenanceRequest[]> => {
    const response = await api.get('/requests/calendar', { params: { start, end } });
    return response.data;
  },
};

export const getFiltered = async (filters: RequestFilters): Promise<MaintenanceRequest[]> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value.trim() !== '') {
      params.append(key, value);
    }
  });
  const response = await api.get(`/requests?${params.toString()}`);
  return response.data;
};
