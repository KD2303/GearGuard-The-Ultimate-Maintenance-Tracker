"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var requestService_1 = require("../services/requestService");
var lucide_react_1 = require("lucide-react");
var socket_io_client_1 = require("socket.io-client");
var SOCKET_URL = ((_a = import.meta.env.VITE_API_URL) === null || _a === void 0 ? void 0 : _a.replace('/api/v1', '')) || 'http://localhost:5000';
// Custom sleek, glassmorphic Audio Player component
var AudioPlayer = function (_a) {
    var src = _a.src, duration = _a.duration, isMe = _a.isMe;
    var audioRef = (0, react_1.useRef)(null);
    var _b = (0, react_1.useState)(false), isPlaying = _b[0], setIsPlaying = _b[1];
    var _c = (0, react_1.useState)(0), currentTime = _c[0], setCurrentTime = _c[1];
    var _d = (0, react_1.useState)(duration || 0), totalDuration = _d[0], setTotalDuration = _d[1];
    var togglePlay = function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!audioRef.current)
            return;
        if (isPlaying) {
            audioRef.current.pause();
        }
        else {
            audioRef.current.play().catch(function (err) {
                console.error('Playback error:', err);
                alert('Playback error: ' + err.message);
            });
        }
    };
    var handleTimeUpdate = function () {
        if (!audioRef.current)
            return;
        setCurrentTime(audioRef.current.currentTime);
    };
    var handleLoadedMetadata = function () {
        if (!audioRef.current)
            return;
        if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
            setTotalDuration(audioRef.current.duration);
        }
    };
    var handleSeek = function (e) {
        if (!audioRef.current)
            return;
        var time = parseFloat(e.target.value);
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };
    var handleEnded = function () {
        setIsPlaying(false);
        setCurrentTime(0);
    };
    var formatTime = function (time) {
        if (isNaN(time) || time === Infinity)
            return '0:00';
        var mins = Math.floor(time / 60);
        var secs = Math.floor(time % 60);
        return "".concat(mins, ":").concat(secs < 10 ? '0' : '').concat(secs);
    };
    var fullSrc = src.startsWith('http') || src.startsWith('blob:') ? src : (src.startsWith('/') ? src : "".concat(SOCKET_URL).concat(src));
    return (<div className={"flex flex-col gap-1.5 p-3 rounded-xl border shadow-sm w-64 max-w-full backdrop-blur-sm mt-1.5 transition-all duration-300 ".concat(isMe
            ? 'bg-white/20 border-white/20 text-white'
            : 'bg-gray-100/90 dark:bg-gray-800/90 border-gray-200/50 dark:border-gray-700/50 text-gray-850 dark:text-gray-100')}>
      <video ref={audioRef} src={fullSrc} style={{ display: 'none' }} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onPlay={function () { return setIsPlaying(true); }} onPause={function () { return setIsPlaying(false); }} onEnded={handleEnded}/>
      <div className="flex items-center gap-3">
        <button onClick={togglePlay} type="button" className={"flex items-center justify-center w-8 h-8 rounded-full shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 ".concat(isMe ? 'bg-white text-blue-600 hover:bg-white/90' : 'bg-blue-600 hover:bg-blue-700 text-white')}>
          {isPlaying ? (<svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>) : (<svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>)}
        </button>
        <div className="flex-1 flex flex-col gap-1">
          <input type="range" min={0} max={totalDuration || 100} value={currentTime} onChange={handleSeek} className={"w-full h-1 rounded-lg appearance-none cursor-pointer focus:outline-none ".concat(isMe ? 'bg-white/30 accent-white' : 'bg-gray-300 dark:bg-gray-600 accent-blue-600')}/>
          <div className={"flex justify-between text-[10px] font-mono ".concat(isMe ? 'text-white/80' : 'text-gray-500 dark:text-gray-400')}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>
    </div>);
};
var TicketComments = function (_a) {
    var request = _a.request, currentUser = _a.currentUser;
    var _b = (0, react_1.useState)(request.comments || []), comments = _b[0], setComments = _b[1];
    var _c = (0, react_1.useState)(''), newMessage = _c[0], setNewMessage = _c[1];
    var _d = (0, react_1.useState)(false), isTyping = _d[0], setIsTyping = _d[1];
    var _e = (0, react_1.useState)([]), typingUsers = _e[0], setTypingUsers = _e[1];
    var socketRef = (0, react_1.useRef)(null);
    var typingTimeoutRef = (0, react_1.useRef)(null);
    var messagesEndRef = (0, react_1.useRef)(null);
    // Audio Recorder State
    var _f = (0, react_1.useState)(false), isRecording = _f[0], setIsRecording = _f[1];
    var _g = (0, react_1.useState)(0), recordingDuration = _g[0], setRecordingDuration = _g[1];
    var _h = (0, react_1.useState)(null), audioBlob = _h[0], setAudioBlob = _h[1];
    var _j = (0, react_1.useState)(null), audioUrl = _j[0], setAudioUrl = _j[1];
    var _k = (0, react_1.useState)(false), isUploading = _k[0], setIsUploading = _k[1];
    var mediaRecorderRef = (0, react_1.useRef)(null);
    var audioStreamRef = (0, react_1.useRef)(null);
    var timerIntervalRef = (0, react_1.useRef)(null);
    var requestId = request._id || request.id;
    var currentUserName = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.name) || 'Unknown User';
    var currentUserId = (currentUser === null || currentUser === void 0 ? void 0 : currentUser._id) || (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id);
    (0, react_1.useEffect)(function () {
        // Initialize socket connection for this specific component
        var token = localStorage.getItem('gearguard_token');
        var socket = (0, socket_io_client_1.io)(SOCKET_URL, {
            auth: {
                token: token
            }
        });
        socketRef.current = socket;
        if (requestId) {
            socket.emit('join_ticket', requestId);
        }
        socket.on('new_comment', function (data) {
            if (data.ticketId === requestId) {
                setComments(function (prev) {
                    var exists = prev.some(function (c) { return c._id === data.comment._id || (c.timestamp === data.comment.timestamp && c.authorId === data.comment.authorId); });
                    if (!exists)
                        return __spreadArray(__spreadArray([], prev, true), [data.comment], false);
                    return prev;
                });
                // Scroll to bottom
                setTimeout(function () {
                    var _a;
                    (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        });
        socket.on('delete_comment', function (data) {
            if (data.ticketId === requestId) {
                setComments(function (prev) { return prev.filter(function (c) { return c._id !== data.commentId; }); });
            }
        });
        socket.on('user_typing', function (data) {
            setTypingUsers(function (prev) {
                if (!prev.includes(data.userName)) {
                    return __spreadArray(__spreadArray([], prev, true), [data.userName], false);
                }
                return prev;
            });
        });
        socket.on('user_stop_typing', function (data) {
            setTypingUsers(function (prev) { return prev.filter(function (name) { return name !== data.userName; }); });
        });
        return function () {
            if (requestId) {
                socket.emit('leave_ticket', requestId);
            }
            socket.disconnect();
            discardRecording();
        };
    }, [requestId]);
    // Scroll to bottom initially if there are comments
    (0, react_1.useEffect)(function () {
        var _a;
        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'auto' });
    }, [comments]);
    var handleTyping = function (e) {
        setNewMessage(e.target.value);
        if (!isTyping && socketRef.current && requestId) {
            setIsTyping(true);
            socketRef.current.emit('typing', { ticketId: requestId, userName: currentUserName });
        }
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(function () {
            setIsTyping(false);
            if (socketRef.current && requestId) {
                socketRef.current.emit('stop_typing', { ticketId: requestId, userName: currentUserName });
            }
        }, 2000);
    };
    // Start Voice Recording
    var startRecording = function () { return __awaiter(void 0, void 0, void 0, function () {
        var stream, mediaRecorder, chunks_1, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    discardRecording(); // Clean slate
                    return [4 /*yield*/, navigator.mediaDevices.getUserMedia({ audio: true })];
                case 1:
                    stream = _a.sent();
                    audioStreamRef.current = stream;
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorderRef.current = mediaRecorder;
                    chunks_1 = [];
                    mediaRecorder.ondataavailable = function (e) {
                        if (e.data.size > 0) {
                            chunks_1.push(e.data);
                        }
                    };
                    mediaRecorder.onstop = function () {
                        var blob = new Blob(chunks_1, { type: 'audio/webm' });
                        var url = URL.createObjectURL(blob);
                        setAudioBlob(blob);
                        setAudioUrl(url);
                    };
                    mediaRecorder.start();
                    setIsRecording(true);
                    setRecordingDuration(0);
                    timerIntervalRef.current = setInterval(function () {
                        setRecordingDuration(function (prev) { return prev + 1; });
                    }, 1000);
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    console.error('Failed to start recording:', err_1);
                    alert('Microphone access denied or not supported by browser.');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Stop Voice Recording
    var stopRecording = function () {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(function (track) { return track.stop(); });
            audioStreamRef.current = null;
        }
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    };
    // Discard Voice Recording
    var discardRecording = function () {
        stopRecording();
        setAudioBlob(null);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
        }
        setRecordingDuration(0);
    };
    var handleSendMessage = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var content, uploadedAudioUrl, duration, file, uploadResult, addedComment_1, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    e.preventDefault();
                    if (!requestId)
                        return [2 /*return*/];
                    if (!newMessage.trim() && !audioBlob)
                        return [2 /*return*/];
                    content = newMessage.trim();
                    setNewMessage('');
                    // Stop typing immediately
                    setIsTyping(false);
                    if (typingTimeoutRef.current)
                        clearTimeout(typingTimeoutRef.current);
                    if (socketRef.current) {
                        socketRef.current.emit('stop_typing', { ticketId: requestId, userName: currentUserName });
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 5, , 6]);
                    uploadedAudioUrl = '';
                    duration = 0;
                    if (!audioBlob) return [3 /*break*/, 3];
                    setIsUploading(true);
                    file = new File([audioBlob], "voice-comment-".concat(Date.now(), ".webm"), { type: 'audio/webm' });
                    return [4 /*yield*/, requestService_1.requestService.uploadAttachments(requestId, [file])];
                case 2:
                    uploadResult = _c.sent();
                    if (uploadResult && uploadResult[0]) {
                        uploadedAudioUrl = uploadResult[0].fileUrl;
                        duration = recordingDuration;
                    }
                    setIsUploading(false);
                    _c.label = 3;
                case 3: return [4 /*yield*/, requestService_1.requestService.addComment(requestId, content, uploadedAudioUrl, duration)];
                case 4:
                    addedComment_1 = _c.sent();
                    setComments(function (prev) {
                        var exists = prev.some(function (c) { return c._id === addedComment_1._id || (c.timestamp === addedComment_1.timestamp && c.authorId === addedComment_1.authorId); });
                        if (!exists)
                            return __spreadArray(__spreadArray([], prev, true), [addedComment_1], false);
                        return prev;
                    });
                    discardRecording();
                    setTimeout(function () {
                        var _a;
                        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _c.sent();
                    setIsUploading(false);
                    console.error('Failed to send message:', error_1);
                    alert('Failed to post comment: ' + (((_b = (_a = error_1.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || error_1.message));
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleDeleteComment = function (commentId) { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!requestId || !commentId)
                        return [2 /*return*/];
                    if (!window.confirm('Are you sure you want to delete this comment?'))
                        return [2 /*return*/];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, requestService_1.requestService.deleteComment(requestId, commentId)];
                case 2:
                    _c.sent();
                    setComments(function (prev) { return prev.filter(function (c) { return c._id !== commentId; }); });
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _c.sent();
                    console.error('Failed to delete comment:', error_2);
                    alert('Failed to delete comment: ' + (((_b = (_a = error_2.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || error_2.message));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="flex flex-col h-[400px] border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (<div className="h-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            No comments yet. Start the conversation!
          </div>) : (comments.map(function (comment, idx) {
            var isMe = comment.authorId === currentUserId;
            return (<div key={comment._id || idx} className={"flex flex-col ".concat(isMe ? 'items-end' : 'items-start')}>
                <div className="flex items-center gap-2 mb-1">
                  {!isMe && <lucide_react_1.User className="w-3 h-3 text-gray-400"/>}
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {isMe ? 'You' : comment.authorName}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && comment._id && (<button onClick={function () { return handleDeleteComment(comment._id); }} className="ml-1 text-gray-400 hover:text-red-500 transition-colors" title="Unsend">
                      <lucide_react_1.Trash2 className="w-3 h-3"/>
                    </button>)}
                </div>
                <div className={"px-4 py-2 rounded-2xl max-w-[80%] text-sm shadow-sm transition-all duration-300 ".concat(isMe
                    ? 'bg-blue-655 bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-tl-none')}>
                  {comment.content && <p className={comment.audioUrl ? "mb-1" : ""}>{comment.content}</p>}
                  {comment.audioUrl && (<AudioPlayer src={comment.audioUrl} duration={comment.audioDuration} isMe={isMe}/>)}
                </div>
              </div>);
        }))}
        <div ref={messagesEndRef}/>
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (<div className="px-4 py-1 text-xs text-gray-500 dark:text-gray-400 italic bg-transparent">
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>)}

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
        {isRecording ? (<div className="flex items-center justify-between gap-3 px-4 py-2 border border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 rounded-full animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"/>
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 absolute"/>
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 font-mono ml-2">
                Recording... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={stopRecording} className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all hover:scale-105 active:scale-95" title="Stop and Save">
                <lucide_react_1.Square className="w-3.5 h-3.5 fill-current"/>
              </button>
              <button type="button" onClick={discardRecording} className="p-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/40 transition-all hover:scale-105 active:scale-95" title="Discard Recording">
                <lucide_react_1.Trash2 className="w-3.5 h-3.5"/>
              </button>
            </div>
          </div>) : (<form onSubmit={handleSendMessage} className="flex flex-col gap-2">
            {audioUrl && (<div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-fadeIn">
                <div className="flex-1">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">Voice Note Preview:</span>
                  <AudioPlayer src={audioUrl} duration={recordingDuration} isMe={false}/>
                </div>
                <button type="button" onClick={discardRecording} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors" title="Remove voice note">
                  <lucide_react_1.Trash2 className="w-4 h-4"/>
                </button>
              </div>)}
            
            <div className="flex gap-2">
              <input type="text" value={newMessage} onChange={handleTyping} placeholder={audioUrl ? "Add note to voice recording..." : "Type your message..."} disabled={isUploading} className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"/>
              
              {!audioBlob && (<button type="button" onClick={startRecording} disabled={isUploading} className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all active:scale-95 disabled:opacity-50" title="Record Voice Note">
                  <lucide_react_1.Mic className="w-5 h-5"/>
                </button>)}
              
              <button type="submit" disabled={isUploading || (!newMessage.trim() && !audioBlob)} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center min-w-[36px]">
                {isUploading ? (<lucide_react_1.Loader2 className="w-4 h-4 animate-spin"/>) : (<lucide_react_1.Send className="w-4 h-4"/>)}
              </button>
            </div>
          </form>)}
      </div>
    </div>);
};
exports.default = TicketComments;
