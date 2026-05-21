import API from './api';
import { NotificationsResponse, Notification } from '../types';

export const getNotifications = async (): Promise<NotificationsResponse> => {
  const response = await API.get('/notifications');
  return response.data;
};

export const markAsRead = async (id: string): Promise<Notification> => {
  const response = await API.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async (): Promise<void> => {
  await API.patch('/notifications/read-all');
};

export const deleteNotification = async (id: string): Promise<void> => {
  await API.delete(`/notifications/${id}`);
};
