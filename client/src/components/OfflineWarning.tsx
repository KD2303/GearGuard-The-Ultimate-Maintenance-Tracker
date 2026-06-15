import React, { useEffect, useState, useRef } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';
import { dbService } from '../services/db';

const OfflineWarning: React.FC = () => {
  const isOnline = useNetworkStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const initialRender = useRef(true);
  const [pendingChanges, setPendingChanges] = useState(0);

  useEffect(() => {
    const unsubscribe = dbService.subscribe((count) => {
      setPendingChanges(count);
    });
    // Check initial count
    dbService.getQueueCount().then(setPendingChanges);

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      if (!isOnline) {
        setWasOffline(true);
      }
      return;
    }

    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      toast.success('Connection Restored', {
        icon: <Wifi className="w-5 h-5 text-green-500" />,
        duration: 4000,
      });
      setWasOffline(false);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && pendingChanges === 0) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] ${isOnline ? 'bg-orange-500' : 'bg-red-600'} text-white text-center py-2 px-4 shadow-md flex items-center justify-center space-x-2 animate-in slide-in-from-top-10`}>
      {!isOnline ? <WifiOff className="w-5 h-5 animate-pulse" /> : <Wifi className="w-5 h-5 animate-pulse" />}
      <span className="font-bold text-sm md:text-base">
        {!isOnline ? 'Working Offline' : 'Reconnecting...'} {pendingChanges > 0 ? `- ${pendingChanges} changes pending sync` : ''}
      </span>
    </div>
  );
};

export default OfflineWarning;
