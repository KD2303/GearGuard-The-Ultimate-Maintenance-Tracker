import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ShieldAlert, Check, X, Server, Smartphone, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SyncConflict {
  _id: string;
  documentId: string;
  documentModel: string;
  userId: { _id: string; name: string; email: string };
  offlinePayload: any;
  serverDocument: any;
  status: string;
  createdAt: string;
}

const ConflictResolution: React.FC = () => {
  const { user } = useAuth();
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchConflicts = async () => {
    try {
      const { data } = await api.get('/api/v1/conflicts');
      setConflicts(data);
    } catch (error) {
      console.error('Failed to fetch conflicts', error);
      toast.error('Failed to load sync conflicts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConflicts();
  }, []);

  const handleResolve = async (id: string, strategy: 'accept_client' | 'accept_server') => {
    try {
      setResolvingId(id);
      await api.post(`/api/v1/conflicts/${id}/resolve`, { resolutionStrategy: strategy });
      toast.success('Conflict resolved successfully');
      fetchConflicts();
    } catch (error) {
      console.error('Error resolving conflict', error);
      toast.error('Failed to resolve conflict');
    } finally {
      setResolvingId(null);
    }
  };

  if (user?.role !== 'Admin' && user?.role !== 'Manager') {
    return <div className="p-8 text-center text-gray-500">Access Denied</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <ShieldAlert className="w-6 h-6 mr-3 text-red-500" />
          Offline Sync Conflicts
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Review and resolve synchronization conflicts that occurred while technicians were offline.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : conflicts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Clear</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">There are no pending synchronization conflicts.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {conflicts.map(conflict => (
            <div key={conflict._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Conflict in {conflict.documentModel}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Document ID: {conflict.documentId} • Submitted by: {conflict.userId.name} ({conflict.userId.email})
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(conflict.createdAt).toLocaleString()}
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Server Version */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/20">
                  <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <Server className="w-4 h-4 mr-2 text-blue-500" />
                    Current Server Version
                  </div>
                  <pre className="text-xs overflow-auto h-48 bg-gray-800 text-gray-100 p-3 rounded">
                    {JSON.stringify(conflict.serverDocument, null, 2)}
                  </pre>
                  <button
                    onClick={() => handleResolve(conflict._id, 'accept_server')}
                    disabled={resolvingId === conflict._id}
                    className="mt-4 w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Keep Server Data
                  </button>
                </div>

                {/* Client Version */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/20">
                  <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <Smartphone className="w-4 h-4 mr-2 text-green-500" />
                    Offline Client Update
                  </div>
                  <pre className="text-xs overflow-auto h-48 bg-gray-800 text-gray-100 p-3 rounded border border-green-500/30">
                    {JSON.stringify(conflict.offlinePayload, null, 2)}
                  </pre>
                  <button
                    onClick={() => handleResolve(conflict._id, 'accept_client')}
                    disabled={resolvingId === conflict._id}
                    className="mt-4 w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    Accept Offline Data
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConflictResolution;
