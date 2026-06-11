"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var date_fns_1 = require("date-fns");
var lucide_react_1 = require("lucide-react");
var Badge_1 = require("./Badge");
var EquipmentHistoryTimeline = function (_a) {
    var history = _a.history;
    if (!history || history.length === 0) {
        return (<div className="p-8 text-center border border-dashed border-slate-700 rounded-lg">
        <lucide_react_1.ShieldAlert className="h-8 w-8 mx-auto text-slate-500 mb-2"/>
        <p className="text-slate-400">No major lifecycle events recorded yet.</p>
      </div>);
    }
    // Sort history newest first
    var sortedHistory = __spreadArray([], history, true).sort(function (a, b) { return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(); });
    var getEventConfig = function (eventType) {
        switch (eventType) {
            case 'PURCHASED':
                return { icon: <lucide_react_1.ShoppingBag className="h-4 w-4 text-blue-500"/>, bg: 'bg-blue-500/20' };
            case 'CREATED':
                return { icon: <lucide_react_1.Plus className="h-4 w-4 text-emerald-500"/>, bg: 'bg-emerald-500/20' };
            case 'STATUS_CHANGE':
                return { icon: <lucide_react_1.Activity className="h-4 w-4 text-amber-500"/>, bg: 'bg-amber-500/20' };
            case 'REPAIR_COMPLETED':
                return { icon: <lucide_react_1.CheckCircle className="h-4 w-4 text-emerald-500"/>, bg: 'bg-emerald-500/20' };
            case 'ASSIGNED':
                return { icon: <lucide_react_1.Users className="h-4 w-4 text-purple-500"/>, bg: 'bg-purple-500/20' };
            case 'SCRAPPED':
                return { icon: <lucide_react_1.Trash2 className="h-4 w-4 text-red-500"/>, bg: 'bg-red-500/20' };
            default:
                return { icon: <lucide_react_1.Activity className="h-4 w-4 text-slate-500"/>, bg: 'bg-slate-500/20' };
        }
    };
    var getEventBadgeVariant = function (eventType) {
        switch (eventType) {
            case 'PURCHASED': return 'info';
            case 'CREATED': return 'success';
            case 'STATUS_CHANGE': return 'warning';
            case 'REPAIR_COMPLETED': return 'success';
            case 'ASSIGNED': return 'default'; // Or custom purple if added to Badge.tsx
            case 'SCRAPPED': return 'danger';
            default: return 'default';
        }
    };
    return (<div className="space-y-6">
      <div className="flow-root">
        <ul className="-mb-8">
          {sortedHistory.map(function (event, idx) {
            var config = getEventConfig(event.eventType);
            return (<li key={event._id || idx}>
                <div className="relative pb-8">
                  {idx !== sortedHistory.length - 1 && (<span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-700" aria-hidden="true"/>)}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className={"h-8 w-8 rounded-full ".concat(config.bg, " flex items-center justify-center ring-8 ring-slate-900")}>
                        {config.icon}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="text-sm text-slate-300">
                          <Badge_1.default variant={getEventBadgeVariant(event.eventType)} size="sm" className="mr-2">
                            {event.eventType.replace('_', ' ')}
                          </Badge_1.default>
                          <span className="font-medium text-white">{event.userName || 'System'}</span>
                        </p>
                        
                        <div className="mt-2 text-sm text-slate-400">
                          <div className="bg-slate-800/50 p-3 rounded-md border border-slate-700/50">
                            <span className="text-slate-300">{event.description}</span>
                          </div>
                        </div>
                      </div>
                      <div className="whitespace-nowrap text-right text-xs text-slate-500">
                        {(0, date_fns_1.formatDistanceToNow)(new Date(event.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              </li>);
        })}
        </ul>
      </div>
    </div>);
};
exports.default = EquipmentHistoryTimeline;
