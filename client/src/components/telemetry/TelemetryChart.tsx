import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';

interface TelemetryChartProps {
  equipmentId: string;
  metricType: 'temperature' | 'vibration' | 'pressure' | 'humidity' | 'voltage';
}

interface DataPoint {
  time: string;
  value: number;
}

const TelemetryChart: React.FC<TelemetryChartProps> = ({ equipmentId, metricType }) => {
  const { user } = useAuth();
  const [data, setData] = useState<DataPoint[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Fill initial mock data
    const initialData: DataPoint[] = Array.from({ length: 20 }).map((_, i) => ({
      time: new Date(Date.now() - (20 - i) * 2000).toLocaleTimeString([], { hour12: false }),
      value: metricType === 'temperature' ? 60 + Math.random() * 10 : 10 + Math.random() * 5
    }));
    setData(initialData);

    if (!user) return;

    const token = localStorage.getItem('gearguard_token');
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000', {
      auth: { token }
    });

    newSocket.emit('join:telemetry', equipmentId);

    newSocket.on(`telemetry:${metricType}`, (payload: { value: number, timestamp: string }) => {
      setData(prev => {
        const newData = [...prev, { 
          time: new Date(payload.timestamp).toLocaleTimeString([], { hour12: false }), 
          value: payload.value 
        }];
        if (newData.length > 20) newData.shift(); // Keep last 20 points
        return newData;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [equipmentId, metricType, user]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
        Live {metricType} Telemetry
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} tickMargin={10} stroke="#6b7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" domain={['dataMin - 5', 'dataMax + 5']} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              name={metricType}
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TelemetryChart;
