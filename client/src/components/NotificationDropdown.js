"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var lucide_react_1 = require("lucide-react");
var react_router_dom_1 = require("react-router-dom");
var socket_io_client_1 = require("socket.io-client");
var notificationService_1 = require("../services/notificationService");
var SOCKET_URL = ((_a = import.meta.env.VITE_API_URL) === null || _a === void 0 ? void 0 : _a.replace('/api', ''))
    || 'http://localhost:5000';
var NotificationDropdown = function (_a) {
    var userId = _a.userId;
    var _b = (0, react_1.useState)([]), notifications = _b[0], setNotifications = _b[1];
    var _c = (0, react_1.useState)(0), unreadCount = _c[0], setUnreadCount = _c[1];
    var _d = (0, react_1.useState)(false), isOpen = _d[0], setIsOpen = _d[1];
    var _e = (0, react_1.useState)(false), isLoading = _e[0], setIsLoading = _e[1];
    var dropdownRef = (0, react_1.useRef)(null);
    var socketRef = (0, react_1.useRef)(null);
    var navigate = (0, react_router_dom_1.useNavigate)();
    // Fetch notifications on mount
    (0, react_1.useEffect)(function () {
        var fetchNotifications = function () { return __awaiter(void 0, void 0, void 0, function () {
            var data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setIsLoading(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, (0, notificationService_1.getNotifications)()];
                    case 2:
                        data = _a.sent();
                        if (data.notifications) {
                            setNotifications(data.notifications);
                        }
                        else if (Array.isArray(data)) {
                            // fallback if backend returns array
                            setNotifications(data);
                        }
                        if (data.unreadCount !== undefined) {
                            setUnreadCount(data.unreadCount);
                        }
                        else {
                            // fallback calculation
                            setUnreadCount((Array.isArray(data) ? data : data.notifications || []).filter(function (n) { return !n.isRead && !n.read; }).length);
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Failed to fetch notifications:', error_1);
                        return [3 /*break*/, 5];
                    case 4:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        fetchNotifications();
    }, []);
    // Socket.io real-time connection
    (0, react_1.useEffect)(function () {
        if (!userId)
            return;
        socketRef.current = (0, socket_io_client_1.io)(SOCKET_URL, { withCredentials: true });
        socketRef.current.on('connect', function () {
            var _a;
            (_a = socketRef.current) === null || _a === void 0 ? void 0 : _a.emit('join', userId);
        });
        socketRef.current.on('new_notification', function (notification) {
            setNotifications(function (prev) { return __spreadArray([notification], prev, true).slice(0, 20); });
            setUnreadCount(function (prev) { return prev + 1; });
        });
        // Also listen to the older event name just in case
        socketRef.current.on('notification:new', function (notification) {
            setNotifications(function (prev) { return __spreadArray([notification], prev, true).slice(0, 20); });
            setUnreadCount(function (prev) { return prev + 1; });
        });
        return function () {
            var _a;
            (_a = socketRef.current) === null || _a === void 0 ? void 0 : _a.disconnect();
        };
    }, [userId]);
    // Click outside closes dropdown
    (0, react_1.useEffect)(function () {
        var handleClickOutside = function (e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return function () { return document.removeEventListener('mousedown', handleClickOutside); };
    }, []);
    var handleNotificationClick = function (notification) { return __awaiter(void 0, void 0, void 0, function () {
        var isUnread;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isUnread = notification.isRead === false || notification.read === false;
                    if (!isUnread) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, notificationService_1.markAsRead)(notification._id)];
                case 1:
                    _a.sent();
                    setNotifications(function (prev) {
                        return prev.map(function (n) { return n._id === notification._id ? __assign(__assign({}, n), { isRead: true, read: true }) : n; });
                    });
                    setUnreadCount(function (prev) { return Math.max(0, prev - 1); });
                    _a.label = 2;
                case 2:
                    setIsOpen(false);
                    navigate(notification.link || notification.relatedRequestId ? "/kanban?request=".concat(notification.relatedRequestId) : '/kanban');
                    return [2 /*return*/];
            }
        });
    }); };
    var handleMarkAllRead = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, notificationService_1.markAllAsRead)()];
                case 1:
                    _a.sent();
                    setNotifications(function (prev) { return prev.map(function (n) { return (__assign(__assign({}, n), { isRead: true, read: true })); }); });
                    setUnreadCount(0);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleDelete = function (e, id) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.stopPropagation();
                    return [4 /*yield*/, (0, notificationService_1.deleteNotification)(id)];
                case 1:
                    _a.sent();
                    setNotifications(function (prev) { return prev.filter(function (n) { return n._id !== id; }); });
                    setUnreadCount(function (prev) {
                        return Math.max(0, prev - (notifications.find(function (n) { return n._id === id && (!n.isRead && !n.read); }) ? 1 : 0));
                    });
                    return [2 /*return*/];
            }
        });
    }); };
    var getTypeColor = function (type) {
        switch (type) {
            case 'request_assigned': return 'bg-blue-100 text-blue-600';
            case 'request_updated': return 'bg-green-100 text-green-600';
            case 'request_overdue': return 'bg-red-100 text-red-600';
            case 'request_completed': return 'bg-purple-100 text-purple-600';
            case 'system': return 'bg-red-100 text-red-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };
    var timeAgo = function (dateStr) {
        var diff = Date.now() - new Date(dateStr).getTime();
        var mins = Math.floor(diff / 60000);
        if (mins < 1)
            return 'just now';
        if (mins < 60)
            return "".concat(mins, "m ago");
        var hrs = Math.floor(mins / 60);
        if (hrs < 24)
            return "".concat(hrs, "h ago");
        return "".concat(Math.floor(hrs / 24), "d ago");
    };
    return (<div ref={dropdownRef} className="relative">
      {/* Bell icon with badge */}
      <button onClick={function () { return setIsOpen(function (prev) { return !prev; }); }} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Notifications">
        <lucide_react_1.Bell size={20} className="text-gray-600"/>
        {unreadCount > 0 && (<span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>)}
      </button>

      {/* Dropdown panel */}
      {isOpen && (<div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">
              Notifications
              {unreadCount > 0 && (<span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>)}
            </h3>
            {unreadCount > 0 && (<button onClick={handleMarkAllRead} className="text-xs text-blue-500 hover:text-blue-700 transition-colors">
                Mark all read
              </button>)}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (<div className="p-6 text-center text-sm text-gray-400">Loading...</div>) : notifications.length === 0 ? (<div className="p-6 text-center">
                <lucide_react_1.Bell size={28} className="text-gray-300 mx-auto mb-2"/>
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>) : (notifications.map(function (n) { return (<div key={n._id} onClick={function () { return handleNotificationClick(n); }} className={"flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 transition-colors ".concat(!n.isRead && !n.read ? 'bg-blue-50' : '')}>
                  <span className={"mt-0.5 flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ".concat(getTypeColor(n.type))}>
                    {n.type.replace('_', ' ')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{n.title || n.type}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <button onClick={function (e) { return handleDelete(e, n._id); }} className="flex-shrink-0 text-gray-300 hover:text-gray-500 text-xs mt-0.5">
                    ✕
                  </button>
                </div>); }))}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (<div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400 text-center">
                Showing latest {notifications.length} notification(s)
              </p>
            </div>)}
        </div>)}
    </div>);
};
exports.default = NotificationDropdown;
