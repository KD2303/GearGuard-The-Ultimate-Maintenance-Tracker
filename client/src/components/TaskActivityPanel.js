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
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var activityService_1 = require("../services/activityService");
var lucide_react_1 = require("lucide-react");
var Spinner_1 = require("./Spinner");
var TaskActivityPanel = function (_a) {
    var requestId = _a.requestId;
    var _b = (0, react_1.useState)([]), activities = _b[0], setActivities = _b[1];
    var _c = (0, react_1.useState)(true), loading = _c[0], setLoading = _c[1];
    var _d = (0, react_1.useState)('all'), filter = _d[0], setFilter = _d[1];
    (0, react_1.useEffect)(function () {
        loadActivities();
    }, [requestId, filter]);
    var loadActivities = function () { return __awaiter(void 0, void 0, void 0, function () {
        var data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, 8, 9]);
                    data = void 0;
                    if (!requestId) return [3 /*break*/, 2];
                    return [4 /*yield*/, activityService_1.activityService.getAll()];
                case 1:
                    // Load activities for specific request
                    data = _a.sent();
                    return [3 /*break*/, 6];
                case 2:
                    if (!(filter !== 'all')) return [3 /*break*/, 4];
                    return [4 /*yield*/, activityService_1.activityService.getByType(filter)];
                case 3:
                    data = _a.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, activityService_1.activityService.getRecent(20)];
                case 5:
                    data = _a.sent();
                    _a.label = 6;
                case 6:
                    setActivities(data);
                    return [3 /*break*/, 9];
                case 7:
                    error_1 = _a.sent();
                    console.error('Failed to load activities:', error_1);
                    // Mock detailed activities
                    setActivities([
                        {
                            id: '1',
                            type: 'request_created',
                            title: 'Maintenance Request Created',
                            description: 'Request #MR-2024-001 was created for Hydraulic Press routine inspection. Priority set to HIGH due to safety concerns.',
                            userName: 'John Smith',
                            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                            metadata: { priority: 'high', requestId: 'MR-2024-001' }
                        },
                        {
                            id: '2',
                            type: 'team_assigned',
                            title: 'Team Assignment Updated',
                            description: 'Hydraulic Systems Team has been assigned to handle the inspection. Team lead Sarah Johnson will coordinate the maintenance.',
                            userName: 'Admin',
                            timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
                            metadata: { teamId: 'team-1' }
                        },
                        {
                            id: '3',
                            type: 'request_updated',
                            title: 'Request Status Changed',
                            description: 'Request moved from NEW to IN-PROGRESS stage. Initial diagnostics started by technician Mike Davis.',
                            userName: 'Mike Davis',
                            timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
                            metadata: { status: 'in-progress' }
                        },
                        {
                            id: '4',
                            type: 'equipment_updated',
                            title: 'Equipment Status Updated',
                            description: 'Hydraulic Press #HP-001 status changed to UNDER MAINTENANCE. Equipment taken offline for inspection.',
                            userName: 'Mike Davis',
                            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
                            metadata: { equipmentId: 'eq-1' }
                        },
                        {
                            id: '5',
                            type: 'request_updated',
                            title: 'Maintenance Log Added',
                            description: 'Inspection findings logged: Hydraulic fluid levels normal, minor seal wear detected. Replacement parts ordered.',
                            userName: 'Mike Davis',
                            timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
                        },
                        {
                            id: '6',
                            type: 'request_completed',
                            title: 'Maintenance Completed',
                            description: 'All maintenance work completed successfully. New seals installed, system pressure tested and verified. Equipment ready for production.',
                            userName: 'Sarah Johnson',
                            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
                        },
                    ]);
                    return [3 /*break*/, 9];
                case 8:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var getActivityIcon = function (type) {
        switch (type) {
            case 'request_created':
                return <lucide_react_1.FileText className="w-5 h-5 text-blue-500"/>;
            case 'request_updated':
                return <lucide_react_1.Wrench className="w-5 h-5 text-yellow-500"/>;
            case 'request_completed':
                return <lucide_react_1.CheckCircle className="w-5 h-5 text-green-500"/>;
            case 'equipment_updated':
                return <lucide_react_1.Package className="w-5 h-5 text-purple-500"/>;
            case 'team_assigned':
                return <lucide_react_1.Users className="w-5 h-5 text-indigo-500"/>;
            case 'member_added':
                return <lucide_react_1.UserPlus className="w-5 h-5 text-teal-500"/>;
            default:
                return <lucide_react_1.MessageSquare className="w-5 h-5 text-gray-500"/>;
        }
    };
    var getActivityBgColor = function (type) {
        switch (type) {
            case 'request_created':
                return 'bg-blue-50 dark:bg-gray-800 border-blue-200 dark:border-gray-700';
            case 'request_updated':
                return 'bg-yellow-50 dark:bg-gray-800 border-yellow-200 dark:border-gray-700';
            case 'request_completed':
                return 'bg-green-50 dark:bg-gray-800 border-green-200 dark:border-gray-700';
            case 'equipment_updated':
                return 'bg-purple-50 dark:bg-gray-800 border-purple-200 dark:border-gray-700';
            case 'team_assigned':
                return 'bg-indigo-50 dark:bg-gray-800 border-indigo-200 dark:border-gray-700';
            case 'member_added':
                return 'bg-teal-50 dark:bg-gray-800 border-teal-200 dark:border-gray-700';
            default:
                return 'bg-gray-50 border-gray-200 dark:border-gray-700';
        }
    };
    var getTimeAgo = function (timestamp) {
        var now = new Date();
        var activityTime = new Date(timestamp);
        var diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / 1000 / 60);
        if (diffInMinutes < 1)
            return 'Just now';
        if (diffInMinutes < 60)
            return "".concat(diffInMinutes, "m ago");
        if (diffInMinutes < 1440)
            return "".concat(Math.floor(diffInMinutes / 60), "h ago");
        return "".concat(Math.floor(diffInMinutes / 1440), "d ago");
    };
    var filterButtons = [
        { label: 'All', value: 'all' },
        { label: 'Requests', value: 'request_created' },
        { label: 'Updates', value: 'request_updated' },
        { label: 'Completed', value: 'request_completed' },
        { label: 'Equipment', value: 'equipment_updated' },
    ];
    if (loading) {
        return (<div className="bg-white rounded-lg shadow p-6 flex justify-center items-center h-[400px]">
        <Spinner_1.default size="md" label="Loading activity..."/>
      </div>);
    }
    return (<div className="bg-white dark:bg-gray-800 transition-colors rounded-lg shadow">
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Task Activity</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Detailed activity log with descriptions</p>
      </div>

      {/* Filter Buttons */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
        {filterButtons.map(function (btn) { return (<button key={btn.value} onClick={function () { return setFilter(btn.value); }} className={"px-4 py-1.5 text-sm rounded-full transition-all duration-200\n              ".concat(filter === btn.value
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-gray-100 dark:bg-gray-700 transition-colors duration-200 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600', "\n            ")}>
            {btn.label}
          </button>); })}
      </div>

      <div className="p-6 max-h-[600px] overflow-y-auto">
        <div className="space-y-4">
          {activities.map(function (activity) {
            var _a, _b;
            return (<div key={activity.id} className={"border rounded-lg p-4 ".concat(getActivityBgColor(activity.type))}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 transition-colors shadow-sm dark:shadow-none flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {activity.title}
                      </h4>
                      <p className="mt-1 text-sm text-gray-800 dark:text-gray-100 leading-relaxed">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                    {activity.userName && (<div className="flex items-center">
                        <lucide_react_1.Users className="w-3 h-3 mr-1"/>
                        <span className="font-medium">{activity.userName}</span>
                      </div>)}
                    <div className="flex items-center">
                      <lucide_react_1.Clock className="w-3 h-3 mr-1"/>
                      <span>{getTimeAgo(activity.timestamp)}</span>
                    </div>
                    {((_a = activity.metadata) === null || _a === void 0 ? void 0 : _a.priority) && (<span className={"px-2 py-0.5 rounded-full text-xs font-medium ".concat(activity.metadata.priority === 'urgent'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : activity.metadata.priority === 'high'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            : activity.metadata.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400')}>
                        {activity.metadata.priority.toUpperCase()}
                      </span>)}
                    {((_b = activity.metadata) === null || _b === void 0 ? void 0 : _b.requestId) && (<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 transition-colors duration-200 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600">
                        {activity.metadata.requestId}
                      </span>)}
                  </div>
                </div>
              </div>
            </div>);
        })}
        </div>

        {activities.length === 0 && (<div className="text-center py-12">
            <lucide_react_1.MessageSquare className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"/>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No activities yet</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Task activities will appear here as they happen.
            </p>
          </div>)}
      </div>
    </div>);
};
exports.default = TaskActivityPanel;
