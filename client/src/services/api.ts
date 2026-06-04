import axios from 'axios';
import toast from 'react-hot-toast';
import { dbService } from './db';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
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

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Error interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If it's a network error and a mutation (POST/PUT/PATCH/DELETE), queue it
    if (!error.response && originalRequest && ['post', 'put', 'patch', 'delete'].includes(originalRequest.method?.toLowerCase() || '')) {
      console.log('[Offline] Network error detected, queueing action:', originalRequest);
      await dbService.addSyncAction({
        url: originalRequest.url || '',
        method: originalRequest.method?.toUpperCase() as any,
        payload: originalRequest.data ? JSON.parse(originalRequest.data) : undefined,
      });
      toast.success('Action saved offline. Will sync when connected.');
      // Return a fake successful response to prevent the UI from crashing
      return Promise.resolve({ data: { success: true, offline: true } });
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { baseURL: API_BASE_URL, withCredentials: true });
        const newToken = data.token;
        localStorage.setItem('gearguard_token', newToken);
        api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        // Clear expired auth data and force redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('gearguard_token');
        localStorage.removeItem('gearguard_user');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
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