import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface SlaTimerProps {
  slaDeadline?: string;
  slaBreached?: boolean;
  stage: string;
}

const SlaTimer: React.FC<SlaTimerProps> = ({ slaDeadline, slaBreached, stage }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isCurrentlyBreached, setIsCurrentlyBreached] = useState(slaBreached);

  useEffect(() => {
    if (!slaDeadline || stage === 'repaired' || stage === 'scrap') {
      return;
    }

    const calculateTime = () => {
      const now = new Date().getTime();
      const deadline = new Date(slaDeadline).getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setIsCurrentlyBreached(true);
        const absDiff = Math.abs(diff);
        const hours = Math.floor(absDiff / (1000 * 60 * 60));
        const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`Breached by ${hours}h ${minutes}m`);
      } else {
        setIsCurrentlyBreached(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 48) {
          setTimeRemaining(`${Math.floor(hours / 24)}d left`);
        } else {
          setTimeRemaining(`${hours}h ${minutes}m left`);
        }
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [slaDeadline, stage]);

  if (!slaDeadline) return null;

  if (stage === 'repaired' || stage === 'scrap') {
    return (
      <div className="flex items-center text-xs text-gray-500 mt-1">
        <Clock className="h-3 w-3 mr-1" />
        SLA Resolved
      </div>
    );
  }

  if (isCurrentlyBreached) {
    return (
      <div className="flex items-center text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded w-fit mt-1 border border-red-200 dark:border-red-800">
        <AlertTriangle className="h-3 w-3 mr-1 animate-pulse" />
        {timeRemaining}
      </div>
    );
  }

  return (
    <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded w-fit mt-1 border border-blue-100 dark:border-blue-800">
      <Clock className="h-3 w-3 mr-1" />
      SLA: {timeRemaining}
    </div>
  );
};

export default SlaTimer;
