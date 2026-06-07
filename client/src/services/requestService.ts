import api from './api';
import { MaintenanceRequest, CreateMaintenanceRequestDto, RequestFilters, PaginatedResponse } from '../types';
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
    totalFinancialLoss?: number;
    moneySaved?: number;
  };
  charts: {
    stageBreakdown: Array<{ stage: string; value: number }>;
    typeBreakdown: Array<{ type: string; value: number }>;
    trend: Array<{ date: string; total: number; completed: number }>;
    costByCategory?: Array<{ category: string; value: number }>;
    costByDepartment?: Array<{ department: string; value: number }>;
    topExpensiveMachines?: Array<{ name: string; value: number }>;
  };
}

export const requestService = {
  getAll: async (
    filters?: RequestFilters
  ): Promise<PaginatedResponse<MaintenanceRequest>> => {
    const response = await api.get("/requests", {
      params: filters,
    });

    return response.data;
  },

  getById: async (
    id: string
  ): Promise<MaintenanceRequest> => {
    const response = await api.get(`/requests/${id}`);

    return response.data;
  },

  create: async (
    data: CreateMaintenanceRequestDto
  ): Promise<MaintenanceRequest> => {
    const response = await api.post(
      "/requests",
      data
    );

    toast.success("Request created successfully");

    return response.data;
  },

  update: async (
    id: string,
    data: Partial<MaintenanceRequest>
  ): Promise<MaintenanceRequest> => {
    const response = await api.put(
      `/requests/${id}`,
      data
    );

    toast.success("Request updated successfully");

    return response.data;
  },

  updateStage: async (
    id: string,
    stage: string,
    partsCost?: number,
    laborCost?: number
  ): Promise<MaintenanceRequest> => {
    const response = await api.patch(
      `/requests/${id}/stage`,
      { stage, partsCost, laborCost }
    );

    toast.success("Request stage updated");

    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/requests/${id}`);

    toast.success("Request deleted successfully");
  },

  getCalendarEvents: async (
    start?: string,
    end?: string
  ): Promise<MaintenanceRequest[]> => {
    const response = await api.get(
      "/requests/calendar",
      {
        params: { start, end },
      }
    );

    return response.data;
  },
  getAnalytics: async (query: AnalyticsQuery): Promise<AnalyticsResponse> => {
    const response = await api.get('/analytics', { params: query });
    return response.data;
  },

  getFiltered: async (
    filters: RequestFilters
  ): Promise<PaginatedResponse<MaintenanceRequest>> => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(
      ([key, value]) => {
        if (
          value !== undefined && value !== null &&
          value.toString().trim() !== ""
        ) {
          params.append(
            key,
            value.toString()
          );
        }
      }
    );

    const response = await api.get(
      `/requests?${params.toString()}`
    );

    return response.data;
  },

  addComment: async (requestId: string, content: string, audioUrl?: string, audioDuration?: number): Promise<any> => {
    const response = await api.post(`/requests/${requestId}/comments`, { content, audioUrl, audioDuration });
    return response.data;
  },

  deleteComment: async (requestId: string, commentId: string): Promise<any> => {
    const response = await api.delete(`/requests/${requestId}/comments/${commentId}`);
    return response.data;
  },

  smartAssign: async (id: string): Promise<MaintenanceRequest> => {
    const response = await api.post(`/requests/${id}/smart-assign`);
    const assignedName = response.data.assignedTo?.name || "a technician";
    toast.success(`Automatically assigned to ${assignedName}!`);
    return response.data;
  },

  getPredictions: async (requestId: string): Promise<any[]> => {
    const response = await api.get(`/requests/${requestId}/predictions`);
    return response.data;
  },

  reservePart: async (requestId: string, partId: string, quantityUsed: number = 1): Promise<MaintenanceRequest> => {
    const response = await api.post(`/requests/${requestId}/parts`, { partId, quantityUsed });
    return response.data;
  },

  uploadAttachments: async (requestId: string, files: File[]): Promise<any[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('attachments', file);
    });

    const response = await api.post(`/requests/${requestId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    toast.success("Attachments uploaded successfully");
    return response.data;
  },

  deleteAttachment: async (requestId: string, attachmentId: string): Promise<void> => {
    await api.delete(`/requests/${requestId}/attachments/${attachmentId}`);
    toast.success("Attachment deleted successfully");
  }
};