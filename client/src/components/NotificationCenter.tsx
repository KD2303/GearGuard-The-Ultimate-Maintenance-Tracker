import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { Notification } from '../types';

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'request_created': return <Info className="h-4 w-4 text-blue-500" />;
      case 'request_completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'request_deleted': return <X className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-purple-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    setIsOpen(false);
    
    // Navigate based on type
    if (notification.type === 'system') {
      navigate('/vehicles');
    } else {
      navigate('/requests-all');
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Icon & Badge */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "relative rounded-xl border p-2 backdrop-blur-xl transition-all duration-300",
          isOpen 
            ? "border-purple-300 bg-white/60 text-purple-600 shadow-inner" 
            : "border-white/50 bg-white/30 text-gray-600 shadow-sm hover:border-white/70 hover:text-purple-600 hover:bg-white/60"
        )}
      >
        <Bell className={clsx("h-5 w-5 transition-transform", isOpen && "scale-110")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 lg:w-96 glass rounded-2xl border border-white/60 bg-white/90 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-3 duration-300 overflow-hidden z-[60]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-4">
            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsRead()}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[28rem] overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 transition-all">
                <div className="bg-gray-100 rounded-full p-4 mb-3">
                  <Bell className="h-8 w-8 text-gray-400 opacity-50" />
                </div>
                <p className="text-sm text-gray-500 font-medium">No alerts yet</p>
                <p className="text-xs text-gray-400">We'll notify you when things change.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div 
                    key={notification._id}
                    className={clsx(
                      "group relative p-4 transition-all duration-200 border-l-4",
                      !notification.read 
                        ? "bg-purple-50/80 border-purple-500 hover:bg-purple-100/80 shadow-sm z-10" 
                        : "bg-transparent border-transparent hover:bg-gray-50/80"
                    )}
                  >
                    <div className="flex space-x-3">
                      <div className="mt-1 flex-shrink-0">
                        {getIcon(notification.type)}
                      </div>
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <p className={clsx(
                          "text-sm",
                          !notification.read ? "font-bold text-gray-900" : "font-medium text-gray-600 font-medium"
                        )}>
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-400 font-medium whitespace-nowrap">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <button 
                            onClick={() => markAsRead(notification._id)}
                            className="text-gray-400 hover:text-green-600 transition-colors"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteNotification(notification._id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer (User Preferences Link) */}
          <div className="border-t border-gray-100 bg-gray-50/50 p-3 text-center">
            <Link 
              to="/settings" 
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Manage alert settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
