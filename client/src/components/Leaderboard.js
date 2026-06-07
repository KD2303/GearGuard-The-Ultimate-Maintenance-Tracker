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
var teamService_1 = require("../services/teamService");
var lucide_react_1 = require("lucide-react");
var Leaderboard = function () {
    var _a = (0, react_1.useState)([]), leaders = _a[0], setLeaders = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    (0, react_1.useEffect)(function () {
        var fetchLeaderboard = function () { return __awaiter(void 0, void 0, void 0, function () {
            var data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, 3, 4]);
                        return [4 /*yield*/, teamService_1.teamService.getLeaderboard()];
                    case 1:
                        data = _a.sent();
                        setLeaders(data);
                        return [3 /*break*/, 4];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Failed to load leaderboard', error_1);
                        return [3 /*break*/, 4];
                    case 3:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        fetchLeaderboard();
    }, []);
    if (loading) {
        return <div className="p-4 text-center text-gray-500">Loading leaderboard...</div>;
    }
    if (leaders.length === 0) {
        return (<div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/50 rounded-xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-4">
          <lucide_react_1.Trophy className="w-5 h-5 mr-2 text-yellow-500"/>
          Top Technicians
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
          No points awarded yet. Complete tasks to climb the leaderboard!
        </p>
      </div>);
    }
    var renderBadgeIcon = function (badge) {
        switch (badge) {
            case 'First Responder':
                return <lucide_react_1.Zap className="w-4 h-4 text-amber-500"/>;
            case 'Zero Downtime':
                return <lucide_react_1.Shield className="w-4 h-4 text-blue-500"/>;
            case 'Master Mechanic':
                return <lucide_react_1.Wrench className="w-4 h-4 text-gray-500 dark:text-gray-300"/>;
            default:
                return <lucide_react_1.Medal className="w-4 h-4 text-purple-500"/>;
        }
    };
    return (<div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/40 dark:border-gray-700/50 rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-6">
        <lucide_react_1.Trophy className="w-5 h-5 mr-2 text-yellow-500"/>
        Leaderboard
      </h3>
      <div className="space-y-3">
        {leaders.map(function (member, index) {
            var _a;
            return (<div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-900/50 border border-white/20 dark:border-gray-700/30 shadow-sm hover:bg-white/60 dark:hover:bg-gray-900/70 transition-all">
            <div className="flex items-center space-x-3">
              <div className={"flex items-center justify-center w-8 h-8 rounded-full font-bold ".concat(index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-200 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400')}>
                {index + 1}
              </div>
              {member.avatar ? (<img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"/>) : (<div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium border border-primary-200 dark:border-primary-800">
                  {member.name.charAt(0).toUpperCase()}
                </div>)}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{member.name}</p>
                <div className="flex space-x-1 mt-1">
                  {(_a = member.badges) === null || _a === void 0 ? void 0 : _a.map(function (badge, idx) { return (<div key={idx} title={badge} className="bg-white/50 dark:bg-gray-800/50 rounded-full p-1 border border-white/20 dark:border-gray-700/30">
                      {renderBadgeIcon(badge)}
                    </div>); })}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary-600 dark:text-primary-400 leading-none">{member.points || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mt-1">XP</p>
            </div>
          </div>);
        })}
      </div>
    </div>);
};
exports.default = Leaderboard;
