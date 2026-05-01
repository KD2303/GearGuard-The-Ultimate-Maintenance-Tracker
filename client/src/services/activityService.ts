import { Activity, CreateActivityDto } from '../types/activity';
import api from './api';
import toast from 'react-hot-toast';

export const activityService = {
  async getAll(): Promise<Activity[]> {
    const response = await api.get('/activities');
    return response.data;
  },

  async getRecent(limit: number = 10): Promise<Activity[]> {
    const response = await api.get(`/activities/recent?limit=${limit}`);
    return response.data;
  },

  async getById(id: string): Promise<Activity> {
    const response = await api.get(`/activities/${id}`);
    return response.data;
  },

  async create(data: CreateActivityDto): Promise<Activity> {
    const response = await api.post('/activities', data);

    toast.success('Activity created successfully');

    return response.data;
  },

  async getByType(type: Activity['type']): Promise<Activity[]> {
    const response = await api.get(`/activities/type/${type}`);
    return response.data;
  },

  async getByUser(userId: string): Promise<Activity[]> {
    const response = await api.get(`/activities/user/${userId}`);
    return response.data;
  },
};