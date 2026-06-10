import React, { useState, useEffect } from 'react';
import { MaintenanceRequest, Tool } from '../types';
import api from '../services/api';
import toast from 'react-hot-toast';
import Button from './Button';
import Badge from './Badge';
import { Wrench, Loader2 } from 'lucide-react';
import Spinner from './Spinner';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

interface RequestToolsTabProps {
  requestRecord: MaintenanceRequest;
  onUpdate: () => void;
}

const RequestToolsTab: React.FC<RequestToolsTabProps> = ({ requestRecord, onUpdate }) => {
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToolId, setSelectedToolId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lockedTools, setLockedTools] = useState<Set<string>>(new Set());

  // Use a ref to hold onUpdate so it doesn't trigger effect re-runs
  const onUpdateRef = React.useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    fetchAvailableTools();

    const socket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('gearguard_token') }
    });

    socket.on('tools_changed', () => {
      fetchAvailableTools();
      onUpdateRef.current(); // Re-fetch the request record to reflect checkout/returns across clients
    });

    socket.on('tool_locked', ({ toolId }: { toolId: string }) => {
      setLockedTools(prev => {
        const next = new Set(prev);
        next.add(toolId);
        return next;
      });
    });

    socket.on('tool_unlocked', ({ toolId }: { toolId: string }) => {
      setLockedTools(prev => {
        const next = new Set(prev);
        next.delete(toolId);
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []); // Run only once on mount

  const fetchAvailableTools = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tools');
      if (res.data) {
        // Filter out tools that are not 'Available'
        setAvailableTools(res.data.filter((t: Tool) => t.status === 'Available'));
      }
    } catch (error: any) {
      toast.error('Failed to load tools: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutTool = async () => {
    if (!selectedToolId) return;
    try {
      setProcessing(true);
      const res = await api.post(`/requests/${requestRecord._id || requestRecord.id}/tools/checkout`, {
        toolId: selectedToolId
      });
      toast.success('Tool checked out successfully');
      setSelectedToolId('');
      onUpdate();
    } catch (error: any) {
      toast.error('Failed to checkout tool: ' + (error.response?.data?.error || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleReturnTool = async (toolId: string) => {
    try {
      const res = await api.post(`/requests/${requestRecord._id || requestRecord.id}/tools/return`, {
        toolId
      });
      toast.success('Tool returned successfully');
      onUpdate();
    } catch (error: any) {
      toast.error('Failed to return tool: ' + (error.response?.data?.error || error.message));
    }
  };

  const checkedOutTools = requestRecord.checkedOutTools || [];

  if (loading && checkedOutTools.length === 0) {
    return <div className="p-8 flex justify-center"><Spinner /></div>;
  }

  return (
    <div className="space-y-6 py-2">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/50">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
            <Wrench className="h-5 w-5 mr-2 text-indigo-500" />
            Tools Checked Out for this Ticket
          </h3>
        </div>
        
        {checkedOutTools.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No tools currently checked out for this request.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {checkedOutTools.map((t, idx) => {
              const toolObj = t.toolId as any;
              const toolName = toolObj?.name || 'Unknown Tool';
              const toolSerial = toolObj?.serialNumber || '';
              const checkoutTime = new Date(t.checkedOutAt).toLocaleString();

              return (
                <div key={idx} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{toolName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SN: {toolSerial} &bull; Checked out: {checkoutTime}</p>
                  </div>
                  <Button variant="secondary" onClick={() => handleReturnTool(toolObj._id || toolObj)}>
                    Return Tool
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl">
        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">Checkout from Tool Crib</h4>
        <div className="flex gap-3">
          <select
            value={selectedToolId}
            onChange={(e) => setSelectedToolId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select an available tool...</option>
            {availableTools.map(tool => {
              const isLocked = lockedTools.has(tool._id || tool.id || '');
              return (
                <option key={tool._id} value={tool._id} disabled={isLocked}>
                  {tool.name} ({tool.serialNumber}) {isLocked ? '🔒 (Locking...)' : ''}
                </option>
              );
            })}
          </select>
          <Button 
            onClick={handleCheckoutTool} 
            disabled={!selectedToolId || processing || lockedTools.has(selectedToolId)}
          >
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Checkout'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RequestToolsTab;
