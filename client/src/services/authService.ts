import api from './api';

export const authService = {
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('gearguard_token', response.data.token);
      localStorage.setItem('gearguard_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  loginWithToken: async (token: string) => {
    localStorage.setItem('gearguard_token', token);
    const response = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    if (response.data.user) {
      localStorage.setItem('gearguard_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/auth/profile', data);
    if (response.data.user) {
      localStorage.setItem('gearguard_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('gearguard_token');
      localStorage.removeItem('user');
      localStorage.removeItem('gearguard_user');
    }
  },

  logoutAll: async () => {
    try {
      await api.post('/auth/logout-all');
    } catch (error) {
      console.error('LogoutAll error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('gearguard_token');
      localStorage.removeItem('user');
      localStorage.removeItem('gearguard_user');
    }
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('gearguard_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('gearguard_token');
  }
};
