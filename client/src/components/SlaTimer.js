"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var SlaTimer = function (_a) {
    var slaDeadline = _a.slaDeadline, slaBreached = _a.slaBreached, stage = _a.stage;
    var _b = (0, react_1.useState)(''), timeRemaining = _b[0], setTimeRemaining = _b[1];
    var _c = (0, react_1.useState)(slaBreached), isCurrentlyBreached = _c[0], setIsCurrentlyBreached = _c[1];
    (0, react_1.useEffect)(function () {
        if (!slaDeadline || stage === 'repaired' || stage === 'scrap') {
            return;
        }
        var calculateTime = function () {
            var now = new Date().getTime();
            var deadline = new Date(slaDeadline).getTime();
            var diff = deadline - now;
            if (diff <= 0) {
                setIsCurrentlyBreached(true);
                var absDiff = Math.abs(diff);
                var hours = Math.floor(absDiff / (1000 * 60 * 60));
                var minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeRemaining("Breached by ".concat(hours, "h ").concat(minutes, "m"));
            }
            else {
                setIsCurrentlyBreached(false);
                var hours = Math.floor(diff / (1000 * 60 * 60));
                var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                if (hours > 48) {
                    setTimeRemaining("".concat(Math.floor(hours / 24), "d left"));
                }
                else {
                    setTimeRemaining("".concat(hours, "h ").concat(minutes, "m left"));
                }
            }
        };
        calculateTime();
        var interval = setInterval(calculateTime, 60000); // Update every minute
        return function () { return clearInterval(interval); };
    }, [slaDeadline, stage]);
    if (!slaDeadline)
        return null;
    if (stage === 'repaired' || stage === 'scrap') {
        return (<div className="flex items-center text-xs text-gray-500 mt-1">
        <lucide_react_1.Clock className="h-3 w-3 mr-1"/>
        SLA Resolved
      </div>);
    }
    if (isCurrentlyBreached) {
        return (<div className="flex items-center text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded w-fit mt-1 border border-red-200 dark:border-red-800">
        <lucide_react_1.AlertTriangle className="h-3 w-3 mr-1 animate-pulse"/>
        {timeRemaining}
      </div>);
    }
    return (<div className="flex items-center text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded w-fit mt-1 border border-blue-100 dark:border-blue-800">
      <lucide_react_1.Clock className="h-3 w-3 mr-1"/>
      SLA: {timeRemaining}
    </div>);
};
exports.default = SlaTimer;
