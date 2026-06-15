import React, { useState, useEffect } from 'react';
import { DollarSign, Clock } from 'lucide-react';

interface DowntimeTickerProps {
  createdAt: string;
  hourlyDowntimeCost: number;
  isResolved?: boolean;
  totalResolvedCost?: number;
}

const DowntimeTicker: React.FC<DowntimeTickerProps> = ({ createdAt, hourlyDowntimeCost, isResolved, totalResolvedCost }) => {
  const [cost, setCost] = useState<number>(0);
  const [duration, setDuration] = useState<string>('');

  useEffect(() => {
    if (isResolved) {
      if (totalResolvedCost !== undefined) {
        setCost(totalResolvedCost);
      }
      return;
    }

    if (!hourlyDowntimeCost) return;

    const calculateCost = () => {
      const now = new Date().getTime();
      const created = new Date(createdAt).getTime();
      const diffMs = now - created;
      const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
      
      const hours = Math.floor(diffSeconds / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;
      
      setDuration(`${hours}h ${minutes}m ${seconds}s`);
      
      const currentCost = (diffSeconds / 3600) * hourlyDowntimeCost;
      setCost(currentCost);
    };

    calculateCost();
    const intervalId = setInterval(calculateCost, 1000);

    return () => clearInterval(intervalId);
  }, [createdAt, hourlyDowntimeCost, isResolved, totalResolvedCost]);

  if (!hourlyDowntimeCost && !isResolved) return null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center justify-between mb-4 shadow-lg shadow-red-900/10">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${isResolved ? 'bg-slate-700 text-slate-400' : 'bg-red-500/20 text-red-500 animate-pulse'}`}>
          <DollarSign className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            {isResolved ? 'Total Downtime Cost' : 'Real-time Downtime Cost'}
          </p>
          <p className={`text-2xl font-bold font-mono ${isResolved ? 'text-slate-300' : 'text-red-400'}`}>
            ${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      
      {!isResolved && (
        <div className="flex flex-col items-end">
          <div className="flex items-center text-slate-400 mb-1">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-xs">Time Elapsed</span>
          </div>
          <span className="font-mono text-slate-300 font-semibold">{duration}</span>
          <span className="text-xs text-slate-500 mt-1">@ ${hourlyDowntimeCost}/hr</span>
        </div>
      )}
    </div>
  );
};

export default DowntimeTicker;
