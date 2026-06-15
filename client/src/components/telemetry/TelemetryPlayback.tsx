import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Thermometer, Activity, Play, Pause, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

interface TelemetryPlaybackProps {
  equipmentId: string;
}

interface RawTelemetry {
  _id: string;
  timestamp: string;
  metadata: {
    metricType: string;
  };
  value: number;
}

const TelemetryPlayback: React.FC<TelemetryPlaybackProps> = ({ equipmentId }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchPlaybackData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/telemetry/playback/${equipmentId}`);
        
        // Group raw telemetry by timestamp
        const groupedData = response.data.data.reduce((acc: any, curr: RawTelemetry) => {
          const timeStr = new Date(curr.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const timeKey = new Date(curr.timestamp).getTime();
          
          if (!acc[timeKey]) {
            acc[timeKey] = { time: timeStr, rawTime: timeKey };
          }
          acc[timeKey][curr.metadata.metricType] = curr.value;
          return acc;
        }, {});

        const formattedData = Object.values(groupedData).sort((a: any, b: any) => a.rawTime - b.rawTime);
        setData(formattedData);
        setSelectedIndex(formattedData.length > 0 ? formattedData.length - 1 : 0);
      } catch (err) {
        console.error("Failed to load telemetry playback:", err);
        setError('Failed to load playback data');
      } finally {
        setLoading(false);
      }
    };

    if (equipmentId) {
      fetchPlaybackData();
    }
  }, [equipmentId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && selectedIndex < data.length - 1) {
      interval = setInterval(() => {
        setSelectedIndex(prev => {
          if (prev >= data.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500); // 500ms per step
    } else if (selectedIndex >= data.length - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, selectedIndex, data.length]);

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">Loading Black Box Data...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center"><AlertTriangle className="mr-2 h-5 w-5" /> {error}</div>;
  }

  if (data.length === 0) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">No historical telemetry data found for the last 1 hour.</div>;
  }

  const currentDataPoint = data[selectedIndex] || {};

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <Activity className="h-5 w-5 mr-2 text-indigo-500" />
            "Black Box" Telemetry Playback
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Scrub timeline to view machine state leading up to failure</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-lg border border-orange-100 dark:border-orange-800/30 flex items-center">
            <Thermometer className="h-5 w-5 text-orange-500 mr-2" />
            <div>
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Temperature</p>
              <p className="text-xl font-bold text-orange-700 dark:text-orange-300">{currentDataPoint.temperature?.toFixed(1) || '--'}°C</p>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800/30 flex items-center">
            <Activity className="h-5 w-5 text-blue-500 mr-2" />
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Vibration</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{currentDataPoint.vibration?.toFixed(2) || '--'} mm/s</p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-64 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12, fill: '#6B7280' }} 
              tickMargin={10}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              yAxisId="left" 
              tick={{ fontSize: 12, fill: '#6B7280' }} 
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              tick={{ fontSize: 12, fill: '#6B7280' }} 
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <RechartsTooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            
            {/* Draw a vertical line at the current scrub position */}
            {data[selectedIndex] && (
               <ReferenceLine 
                 x={data[selectedIndex].time} 
                 stroke="#6366f1" 
                 strokeWidth={2}
                 yAxisId="left"
               />
            )}
            
            <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line yAxisId="right" type="monotone" dataKey="vibration" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
        </button>
        
        <div className="flex-1">
          <input 
            type="range" 
            min={0} 
            max={data.length - 1} 
            value={selectedIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setSelectedIndex(parseInt(e.target.value));
            }}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between mt-2 px-1 text-xs text-gray-500 font-medium">
            <span>{data[0]?.time}</span>
            <span className="text-indigo-600 font-bold">{data[selectedIndex]?.time}</span>
            <span>{data[data.length - 1]?.time}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelemetryPlayback;
