import React, { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Notification } from '../types';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../services/notificationService';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '')
  || 'http://localhost:5000';

interface NotificationDropdownProps {
  userId: string;
}

const NotificationDropdown = ({ userId }: NotificationDropdownProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();

  // Fetch notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const data = await getNotifications();
        if (data.notifications) {
          setNotifications(data.notifications);
        } else if (Array.isArray(data)) {
          // fallback if backend returns array
          setNotifications(data as any);
        }
        if (data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
        } else {
          // fallback calculation
          setUnreadCount((Array.isArray(data) ? data : data.notifications || []).filter(n => !n.isRead && !n.read).length);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // Socket.io real-time connection
  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(SOCKET_URL, { withCredentials: true });

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('join', userId);
    });

    socketRef.current.on('new_notification', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      setUnreadCount((prev) => prev + 1);
    });

    // Also listen to the older event name just in case
    socketRef.current.on('notification:new', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId]);

  // Click outside closes dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    const isUnread = notification.isRead === false || notification.read === false;
    if (isUnread) {
      await markAsRead(notification._id);
      setNotifications((prev) =>
        prev.map((n) => n._id === notification._id ? { ...n, isRead: true, read: true } : n)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    navigate(notification.link || notification.relatedRequestId ? `/kanban?request=${notification.relatedRequestId}` : '/kanban');
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setUnreadCount((prev) =>
      Math.max(0, prev - (notifications.find((n) => n._id === id && (!n.isRead && !n.read)) ? 1 : 0))
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'request_assigned': return 'bg-blue-100 text-blue-600';
      case 'request_updated': return 'bg-green-100 text-green-600';
      case 'request_overdue': return 'bg-red-100 text-red-600';
      case 'request_completed': return 'bg-purple-100 text-purple-600';
      case 'system': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell icon with badge */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center text-sm text-gray-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 transition-colors ${
                    !n.isRead && !n.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className={`mt-0.5 flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${getTypeColor(n.type)}`}>
                    {n.type.replace('_', ' ')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{n.title || n.type}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, n._id)}
                    className="flex-shrink-0 text-gray-300 hover:text-gray-500 text-xs mt-0.5"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400 text-center">
                Showing latest {notifications.length} notification(s)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
