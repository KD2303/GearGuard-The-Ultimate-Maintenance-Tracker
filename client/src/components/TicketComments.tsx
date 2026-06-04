import React, { useState, useEffect, useRef } from 'react';
import { MaintenanceRequest } from '../types';
import { requestService } from '../services/requestService';
import { Send, User, Mic, Square, Trash2, Loader2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface TicketCommentsProps {
  request: MaintenanceRequest;
  currentUser: { _id?: string; id?: string; name: string } | null;
}

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

// Custom sleek, glassmorphic Audio Player component
const AudioPlayer: React.FC<{ src: string; duration?: number; isMe?: boolean }> = ({ src, duration, isMe }) => {
  const audioRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Playback error:', err);
        alert('Playback error: ' + err.message);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setTotalDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === Infinity) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const fullSrc = src.startsWith('http') || src.startsWith('blob:') ? src : (src.startsWith('/') ? src : `${SOCKET_URL}${src}`);

  return (
    <div className={`flex flex-col gap-1.5 p-3 rounded-xl border shadow-sm w-64 max-w-full backdrop-blur-sm mt-1.5 transition-all duration-300 ${
      isMe 
        ? 'bg-white/20 border-white/20 text-white' 
        : 'bg-gray-100/90 dark:bg-gray-800/90 border-gray-200/50 dark:border-gray-700/50 text-gray-850 dark:text-gray-100'
    }`}>
      <video
        ref={audioRef}
        src={fullSrc}
        style={{ display: 'none' }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          type="button"
          className={`flex items-center justify-center w-8 h-8 rounded-full shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 ${
            isMe ? 'bg-white text-blue-600 hover:bg-white/90' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isPlaying ? (
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
        <div className="flex-1 flex flex-col gap-1">
          <input
            type="range"
            min={0}
            max={totalDuration || 100}
            value={currentTime}
            onChange={handleSeek}
            className={`w-full h-1 rounded-lg appearance-none cursor-pointer focus:outline-none ${
              isMe ? 'bg-white/30 accent-white' : 'bg-gray-300 dark:bg-gray-600 accent-blue-600'
            }`}
          />
          <div className={`flex justify-between text-[10px] font-mono ${
            isMe ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
          }`}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const TicketComments: React.FC<TicketCommentsProps> = ({ request, currentUser }) => {
  const [comments, setComments] = useState(request.comments || []);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Audio Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        setComments(prev => {
          const exists = prev.some(c => c._id === data.comment._id || (c.timestamp === data.comment.timestamp && c.authorId === data.comment.authorId));
          if (!exists) return [...prev, data.comment];
          return prev;
        });
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    });

    socket.on('delete_comment', (data: { ticketId: string, commentId: string }) => {
      if (data.ticketId === requestId) {
        setComments(prev => prev.filter(c => c._id !== data.commentId));
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
      discardRecording();
    };
  }, [requestId]);

  // Scroll to bottom initially if there are comments
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [comments]);

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

  // Start Voice Recording
  const startRecording = async () => {
    try {
      discardRecording(); // Clean slate

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      alert('Microphone access denied or not supported by browser.');
    }
  };

  // Stop Voice Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Discard Voice Recording
  const discardRecording = () => {
    stopRecording();
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingDuration(0);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestId) return;
    if (!newMessage.trim() && !audioBlob) return;

    const content = newMessage.trim();
    setNewMessage('');
    
    // Stop typing immediately
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (socketRef.current) {
      socketRef.current.emit('stop_typing', { ticketId: requestId, userName: currentUserName });
    }

    try {
      let uploadedAudioUrl = '';
      let duration = 0;

      if (audioBlob) {
        setIsUploading(true);
        const file = new File([audioBlob], `voice-comment-${Date.now()}.webm`, { type: 'audio/webm' });
        const uploadResult = await requestService.uploadAttachments(requestId, [file]);
        if (uploadResult && uploadResult[0]) {
          uploadedAudioUrl = uploadResult[0].fileUrl;
          duration = recordingDuration;
        }
        setIsUploading(false);
      }

      const addedComment = await requestService.addComment(requestId, content, uploadedAudioUrl, duration);
      
      setComments(prev => {
        const exists = prev.some(c => c._id === addedComment._id || (c.timestamp === addedComment.timestamp && c.authorId === addedComment.authorId));
        if (!exists) return [...prev, addedComment];
        return prev;
      });
      
      discardRecording();
      
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error: any) {
      setIsUploading(false);
      console.error('Failed to send message:', error);
      alert('Failed to post comment: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!requestId || !commentId) return;
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await requestService.deleteComment(requestId, commentId);
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (error: any) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment: ' + (error.response?.data?.error || error.message));
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
                  {isMe && comment._id && (
                    <button 
                      onClick={() => handleDeleteComment(comment._id!)}
                      className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Unsend"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div 
                  className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm shadow-sm transition-all duration-300 ${
                    isMe 
                      ? 'bg-blue-655 bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-tl-none'
                  }`}
                >
                  {comment.content && <p className={comment.audioUrl ? "mb-1" : ""}>{comment.content}</p>}
                  {comment.audioUrl && (
                    <AudioPlayer src={comment.audioUrl} duration={comment.audioDuration} isMe={isMe} />
                  )}
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
        {isRecording ? (
          <div className="flex items-center justify-between gap-3 px-4 py-2 border border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 rounded-full animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 absolute" />
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 font-mono ml-2">
                Recording... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={stopRecording}
                className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all hover:scale-105 active:scale-95"
                title="Stop and Save"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
              <button
                type="button"
                onClick={discardRecording}
                className="p-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/40 transition-all hover:scale-105 active:scale-95"
                title="Discard Recording"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
            {audioUrl && (
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-fadeIn">
                <div className="flex-1">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">Voice Note Preview:</span>
                  <AudioPlayer src={audioUrl} duration={recordingDuration} isMe={false} />
                </div>
                <button
                  type="button"
                  onClick={discardRecording}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors"
                  title="Remove voice note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                placeholder={audioUrl ? "Add note to voice recording..." : "Type your message..."}
                disabled={isUploading}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              
              {!audioBlob && (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isUploading}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all active:scale-95 disabled:opacity-50"
                  title="Record Voice Note"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
              
              <button
                type="submit"
                disabled={isUploading || (!newMessage.trim() && !audioBlob)}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center min-w-[36px]"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TicketComments;
