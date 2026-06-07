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
var recharts_1 = require("recharts");
var socket_io_client_1 = require("socket.io-client");
var AuthContext_1 = require("../../contexts/AuthContext");
var TelemetryChart = function (_a) {
    var equipmentId = _a.equipmentId, metricType = _a.metricType;
    var user = (0, AuthContext_1.useAuth)().user;
    var _b = (0, react_1.useState)([]), data = _b[0], setData = _b[1];
    var _c = (0, react_1.useState)(null), socket = _c[0], setSocket = _c[1];
    (0, react_1.useEffect)(function () {
        var _a;
        // Fill initial mock data
        var initialData = Array.from({ length: 20 }).map(function (_, i) { return ({
            time: new Date(Date.now() - (20 - i) * 2000).toLocaleTimeString([], { hour12: false }),
            value: metricType === 'temperature' ? 60 + Math.random() * 10 : 10 + Math.random() * 5
        }); });
        setData(initialData);
        if (!user)
            return;
        var token = localStorage.getItem('gearguard_token');
        var newSocket = (0, socket_io_client_1.io)(((_a = import.meta.env.VITE_API_URL) === null || _a === void 0 ? void 0 : _a.replace('/api/v1', '')) || 'http://localhost:5000', {
            auth: { token: token }
        });
        newSocket.emit('join:telemetry', equipmentId);
        newSocket.on("telemetry:".concat(metricType), function (payload) {
            setData(function (prev) {
                var newData = __spreadArray(__spreadArray([], prev, true), [{
                        time: new Date(payload.timestamp).toLocaleTimeString([], { hour12: false }),
                        value: payload.value
                    }], false);
                if (newData.length > 20)
                    newData.shift(); // Keep last 20 points
                return newData;
            });
        });
        setSocket(newSocket);
        return function () {
            newSocket.disconnect();
        };
    }, [equipmentId, metricType, user]);
    return (<div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
        Live {metricType} Telemetry
      </h3>
      <div className="h-64 w-full">
        <recharts_1.ResponsiveContainer width="100%" height="100%">
          <recharts_1.LineChart data={data}>
            <recharts_1.CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb"/>
            <recharts_1.XAxis dataKey="time" tick={{ fontSize: 12 }} tickMargin={10} stroke="#6b7280"/>
            <recharts_1.YAxis tick={{ fontSize: 12 }} stroke="#6b7280" domain={['dataMin - 5', 'dataMax + 5']}/>
            <recharts_1.Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
            <recharts_1.Legend />
            <recharts_1.Line type="monotone" dataKey="value" name={metricType} stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} animationDuration={300}/>
          </recharts_1.LineChart>
        </recharts_1.ResponsiveContainer>
      </div>
    </div>);
};
exports.default = TelemetryChart;
