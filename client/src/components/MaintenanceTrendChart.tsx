import React from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
  AreaChart, Area
} from 'recharts';

interface ChartProps {
  data: any[];
  type?: 'line' | 'pie' | 'bar' | 'stackedBar';
  height?: number;
  isDark?: boolean;
}

export const MaintenanceTrendChart: React.FC<ChartProps> = ({ data, type = 'line', height = 300, isDark = false }) => {
  const gridColor = isDark ? '#374151' : '#D1D5DB';
  const axisColor = isDark ? '#D1D5DB' : '#6B7280';
  const tooltipBg = isDark ? '#1F2937' : '#FFFFFF';
  const tooltipText = isDark ? '#F3F4F6' : '#111827';

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={0}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => {
              if (value === undefined) return ['', ''];
              const total = data.reduce((sum, item) => sum + item.value, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
              return [`${value} (${percentage}%)`, 'Count'];
            }}
            contentStyle={{ 
              backgroundColor: tooltipBg, 
              color: tooltipText,
              borderRadius: '8px', 
              border: isDark ? '1px solid #374151' : 'none',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
            }}
          />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, color: tooltipText, borderRadius: '8px', border: isDark ? '1px solid #374151' : 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: tooltipText }}
          />
          <Bar
            dataKey="requests"
            radius={[4, 4, 0, 0]}
            barSize={32}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.overloaded ? '#F43F5E' : '#3B82F6'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'stackedBar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis dataKey="period" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, color: tooltipText, borderRadius: '8px', border: isDark ? '1px solid #374151' : 'none' }}
          />
          <Legend />
          <Bar dataKey="corrective" stackId="a" fill="#EF4444" radius={[0, 0, 0, 0]} />
          <Bar dataKey="preventive" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorCorrective" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPreventive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
        <XAxis
          dataKey="date"
          stroke={axisColor}
          fontSize={10}
          tickLine={false}
          axisLine={false}
          interval={6}
        />
        <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: tooltipBg, color: tooltipText, borderRadius: '8px', border: isDark ? '1px solid #374151' : 'none' }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="corrective"
          stroke="#EF4444"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorCorrective)"
        />
        <Area
          type="monotone"
          dataKey="preventive"
          stroke="#10B981"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorPreventive)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
