import axios from 'axios';
import toast from 'react-hot-toast';
import { dbService } from './db';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gearguard_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Error interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If it's a network error and a mutation (POST/PUT/PATCH/DELETE), queue it
    if (!error.response && error.config && ['post', 'put', 'patch', 'delete'].includes(error.config.method?.toLowerCase() || '')) {
      console.log('[Offline] Network error detected, queueing action:', error.config);
      await dbService.addSyncAction({
        url: error.config.url || '',
        method: error.config.method?.toUpperCase() as any,
        payload: error.config.data ? JSON.parse(error.config.data) : undefined,
      });
      toast.success('Action saved offline. Will sync when connected.');
      // Return a fake successful response to prevent the UI from crashing
      return Promise.resolve({ data: { success: true, offline: true } });
    }

    if (error.response?.status === 401) {
      // Clear expired auth data and force redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('gearguard_token');
      localStorage.removeItem('gearguard_user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    let message = 'Something went wrong';
    
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.response?.data?.error) {
      message = typeof error.response.data.error === 'string' 
        ? error.response.data.error 
        : error.response.data.error.message || 'Something went wrong';
    } else if (error.message) {
      message = error.message;
    }

    toast.error(message);

    if (import.meta.env.DEV) {
      console.error('API Error:', message);
    }

    return Promise.reject(error);
  }
);
export default api;