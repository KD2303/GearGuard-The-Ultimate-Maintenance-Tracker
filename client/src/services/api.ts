import axios from 'axios';
import toast from 'react-hot-toast';

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
  (error) => {
    if (error.response?.status === 401) {
      // Clear expired auth data and force redirect to login
      localStorage.removeItem('gearguard_token');
      localStorage.removeItem('gearguard_user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';

    toast.error(message);

    if (import.meta.env.DEV) {
      console.error('API Error:', message);
    }

    return Promise.reject(error);
  }
);

export default api;