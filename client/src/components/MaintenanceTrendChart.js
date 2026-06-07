"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceTrendChart = void 0;
var react_1 = require("react");
var recharts_1 = require("recharts");
var MaintenanceTrendChart = function (_a) {
    var data = _a.data, _b = _a.type, type = _b === void 0 ? 'line' : _b, _c = _a.height, height = _c === void 0 ? 300 : _c, _d = _a.isDark, isDark = _d === void 0 ? false : _d;
    var gridColor = isDark ? '#374151' : '#D1D5DB';
    var axisColor = isDark ? '#D1D5DB' : '#6B7280';
    var tooltipBg = isDark ? '#1F2937' : '#FFFFFF';
    var tooltipText = isDark ? '#F3F4F6' : '#111827';
    if (type === 'pie') {
        return (<recharts_1.ResponsiveContainer width="100%" height={height}>
        <recharts_1.PieChart>
          <recharts_1.Pie data={data} cx="50%" cy="50%" innerRadius={0} outerRadius={100} paddingAngle={2} dataKey="value">
            {data.map(function (entry, index) { return (<recharts_1.Cell key={"cell-".concat(index)} fill={entry.color || '#3B82F6'}/>); })}
          </recharts_1.Pie>
          <recharts_1.Tooltip formatter={function (value) {
                if (value === undefined)
                    return ['', ''];
                var total = data.reduce(function (sum, item) { return sum + item.value; }, 0);
                var percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                return ["".concat(value, " (").concat(percentage, "%)"), 'Count'];
            }} contentStyle={{
                backgroundColor: tooltipBg,
                color: tooltipText,
                borderRadius: '8px',
                border: isDark ? '1px solid #374151' : 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}/>
          <recharts_1.Legend verticalAlign="bottom" height={36}/>
        </recharts_1.PieChart>
      </recharts_1.ResponsiveContainer>);
    }
    if (type === 'bar') {
        return (<recharts_1.ResponsiveContainer width="100%" height={height}>
        <recharts_1.BarChart data={data}>
          <recharts_1.CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
          <recharts_1.XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false}/>
          <recharts_1.YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false}/>
          <recharts_1.Tooltip contentStyle={{ backgroundColor: tooltipBg, color: tooltipText, borderRadius: '8px', border: isDark ? '1px solid #374151' : 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: tooltipText }}/>
          <recharts_1.Bar dataKey="requests" radius={[4, 4, 0, 0]} barSize={32}>
            {data.map(function (entry, index) { return (<recharts_1.Cell key={"cell-".concat(index)} fill={entry.overloaded ? '#F43F5E' : '#3B82F6'}/>); })}
          </recharts_1.Bar>
        </recharts_1.BarChart>
      </recharts_1.ResponsiveContainer>);
    }
    if (type === 'stackedBar') {
        return (<recharts_1.ResponsiveContainer width="100%" height={height}>
        <recharts_1.BarChart data={data}>
          <recharts_1.CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
          <recharts_1.XAxis dataKey="period" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false}/>
          <recharts_1.YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false}/>
          <recharts_1.Tooltip contentStyle={{ backgroundColor: tooltipBg, color: tooltipText, borderRadius: '8px', border: isDark ? '1px solid #374151' : 'none' }}/>
          <recharts_1.Legend />
          <recharts_1.Bar dataKey="corrective" stackId="a" fill="#EF4444" radius={[0, 0, 0, 0]}/>
          <recharts_1.Bar dataKey="preventive" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]}/>
        </recharts_1.BarChart>
      </recharts_1.ResponsiveContainer>);
    }
    return (<recharts_1.ResponsiveContainer width="100%" height={height}>
      <recharts_1.AreaChart data={data}>
        <defs>
          <linearGradient id="colorCorrective" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorPreventive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <recharts_1.CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
        <recharts_1.XAxis dataKey="date" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} interval={6}/>
        <recharts_1.YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false}/>
        <recharts_1.Tooltip contentStyle={{ backgroundColor: tooltipBg, color: tooltipText, borderRadius: '8px', border: isDark ? '1px solid #374151' : 'none' }}/>
        <recharts_1.Legend />
        <recharts_1.Area type="monotone" dataKey="corrective" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCorrective)"/>
        <recharts_1.Area type="monotone" dataKey="preventive" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorPreventive)"/>
      </recharts_1.AreaChart>
    </recharts_1.ResponsiveContainer>);
};
exports.MaintenanceTrendChart = MaintenanceTrendChart;
