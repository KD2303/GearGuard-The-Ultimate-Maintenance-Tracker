import React, { useState, useEffect, useRef } from 'react';
import { MaintenanceRequest } from '../types';
import { requestService } from '../services/requestService';
import { Send, User } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface TicketCommentsProps {
  request: MaintenanceRequest;
  currentUser: { _id?: string; id?: string; name: string } | null;
}

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5001';

const TicketComments: React.FC<TicketCommentsProps> = ({ request, currentUser }) => {
  const [comments, setComments] = useState(request.comments || []);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const requestId = request._id || request.id;
  const currentUserName = currentUser?.name || 'Unknown User';
  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    // Initialize socket connection for this specific component
    const token = localStorage.getItem('gearguard_token');
    const socket = io(SOCKET_URL, {
      auth: {
        token
      }
    });
    socketRef.current = socket;

    if (requestId) {
      socket.emit('join_ticket', requestId);
    }

    socket.on('new_comment', (data: { ticketId: string, comment: any }) => {
      if (data.ticketId === requestId) {
        setComments(prev => [...prev, data.comment]);
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    });

    socket.on('user_typing', (data: { userName: string }) => {
      setTypingUsers(prev => {
        if (!prev.includes(data.userName)) {
          return [...prev, data.userName];
        }
        return prev;
      });
    });

    socket.on('user_stop_typing', (data: { userName: string }) => {
      setTypingUsers(prev => prev.filter(name => name !== data.userName));
    });

    return () => {
      if (requestId) {
        socket.emit('leave_ticket', requestId);
      }
      socket.disconnect();
    };
  }, [requestId]);

  // Scroll to bottom initially if there are comments
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!isTyping && socketRef.current && requestId) {
      setIsTyping(true);
      socketRef.current.emit('typing', { ticketId: requestId, userName: currentUserName });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socketRef.current && requestId) {
        socketRef.current.emit('stop_typing', { ticketId: requestId, userName: currentUserName });
      }
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !requestId) return;

    const content = newMessage.trim();
    setNewMessage('');
    
    // Stop typing immediately
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (socketRef.current) {
      socketRef.current.emit('stop_typing', { ticketId: requestId, userName: currentUserName });
    }

    try {
      // Optimistic UI update could go here, but we wait for server response to ensure persistence
      const addedComment = await requestService.addComment(requestId, content);
      
      // If socket is disconnected or fails to broadcast back quickly, we ensure it's in the list
      setComments(prev => {
        const exists = prev.some(c => c.timestamp === addedComment.timestamp && c.authorId === addedComment.authorId);
        if (!exists) return [...prev, addedComment];
        return prev;
      });
      
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error: any) {
      console.error('Failed to send message:', error);
      alert('Failed to post comment: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="flex flex-col h-[400px] border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            No comments yet. Start the conversation!
          </div>
        ) : (
          comments.map((comment, idx) => {
            const isMe = comment.authorId === currentUserId;
            return (
              <div key={comment._id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {!isMe && <User className="w-3 h-3 text-gray-400" />}
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {isMe ? 'You' : comment.authorName}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div 
                  className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-tl-none shadow-sm'
                  }`}
                >
                  {comment.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-xs text-gray-500 dark:text-gray-400 italic bg-transparent">
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TicketComments;
