import api from './api';
import { MaintenanceRequest, CreateMaintenanceRequestDto, RequestFilters } from '../types';
import toast from 'react-hot-toast';

export interface AnalyticsQuery {
  range?: '30d' | '90d' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsResponse {
  range: {
    type: string;
    startDate: string;
    endDate: string;
  };
  metrics: {
    totalRequests: number;
    completedRequests: number;
    mttrHours: number;
    overdueRate: number;
  };
  charts: {
    stageBreakdown: Array<{ stage: string; value: number }>;
    typeBreakdown: Array<{ type: string; value: number }>;
    trend: Array<{ date: string; total: number; completed: number }>;
  };
}

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

    toast.success('Request created successfully');

    return response.data;
  },

  update: async (id: string, data: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> => {
    const response = await api.put(`/requests/${id}`, data);

    toast.success('Request updated successfully');

    return response.data;
  },

  updateStage: async (id: string, stage: string): Promise<MaintenanceRequest> => {
    const response = await api.patch(`/requests/${id}/stage`, { stage });

    toast.success('Request stage updated');

    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/requests/${id}`);

    toast.success('Request deleted successfully');
  },

  getCalendarEvents: async (start?: string, end?: string): Promise<MaintenanceRequest[]> => {
    const response = await api.get('/requests/calendar', { params: { start, end } });
    return response.data;
  },
  getAnalytics: async (query: AnalyticsQuery): Promise<AnalyticsResponse> => {
    const response = await api.get('/analytics', { params: query });
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
