import api from './api';

export const adminService = {
  getMetrics: async () => {
    const response = await api.get('/admin/metrics');
    return response.data;
  },
  getAnalytics: async () => {
    const response = await api.get('/admin/analytics');
    return response.data;
  },
  getAlerts: async () => {
    const response = await api.get('/admin/alerts');
    return response.data;
  },
  getRecentActivity: async () => {
    const response = await api.get('/admin/recent-activity');
    return response.data;
  }
};
