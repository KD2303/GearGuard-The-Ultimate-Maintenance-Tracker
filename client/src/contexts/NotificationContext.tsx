import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Socket } from "socket.io-client";
import toast from 'react-hot-toast';
import { Notification } from '../types';
import axios from 'axios';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// In a real app, this URL would come from an environment variable
const SOCKET_URL = 'http://localhost:5005';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [, setSocket] = useState<Socket | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch initial notifications from DB
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Initialize Socket.IO connection
    const newSocket = io(SOCKET_URL);

    // Listen for new notifications
    newSocket.on('notification:new', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      
      // Determine style based on type
      let icon = '🔔';
      let bgColor = '#FFF';
      let textColor = '#333';
      
      if (notification.type === 'request_completed') {
        icon = '✅';
        bgColor = '#ecfdf5'; // Green-50
        textColor = '#065f46'; // Green-900
      } else if (notification.type === 'request_deleted') {
        icon = '⚠️';
        bgColor = '#fef2f2'; // Red-50
        textColor = '#991b1b'; // Red-900
      } else if (notification.type === 'system') {
        icon = 'ℹ️';
        bgColor = '#eff6ff'; // Blue-50
        textColor = '#1e3a8a'; // Blue-900
      }

      // Show Toast
      toast(notification.message, {
        icon,
        duration: 5000,
        position: 'top-right',
        style: {
          borderRadius: '12px',
          background: bgColor,
          color: textColor,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          border: `1px solid ${textColor}20`
        },
      });

      // Optional: Play a subtle notification sound (requires a sound file)
      // new Audio('/notification-sound.mp3').play().catch(() => {});
    });

    return () => {
      newSocket.disconnect();
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch('/api/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
