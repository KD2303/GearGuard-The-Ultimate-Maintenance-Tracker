import React, { useEffect, useState } from 'react';
import { AuditLog } from '../types';
import { auditService } from '../services/auditService';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Plus, Edit2, Trash2 } from 'lucide-react';
import Badge from './Badge';

interface AuditTimelineProps {
  entityType: string;
  entityId: string;
}

const AuditTimeline: React.FC<AuditTimelineProps> = ({ entityType, entityId }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await auditService.getAuditTrail(entityType, entityId);
        if (mounted) setLogs(data);
      } catch (err: any) {
        if (mounted) setError(err.response?.data?.error || 'Failed to load audit logs');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchLogs();
    return () => { mounted = false; };
  }, [entityType, entityId]);

  if (loading) {
    return <div className="p-4 text-center text-slate-500">Loading history...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-700 rounded-lg">
        <Activity className="h-8 w-8 mx-auto text-slate-500 mb-2" />
        <p className="text-slate-400">No history available for this record.</p>
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Plus className="h-4 w-4 text-emerald-500" />;
      case 'UPDATE': return <Edit2 className="h-4 w-4 text-blue-500" />;
      case 'DELETE': return <Trash2 className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return <em className="text-slate-500">empty</em>;
    if (typeof val === 'object') return <span className="font-mono text-xs">{JSON.stringify(val)}</span>;
    return <span>{String(val)}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flow-root">
        <ul className="-mb-8">
          {logs.map((log, idx) => (
            <li key={log._id}>
              <div className="relative pb-8">
                {idx !== logs.length - 1 && (
                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-700" aria-hidden="true" />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center ring-8 ring-slate-900">
                      {getActionIcon(log.action)}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-slate-300">
                        <span className="font-medium text-white">{log.userId?.name || log.userName || 'System'}</span>
                        {' '}
                        {log.action === 'CREATE' ? 'created this record' : log.action === 'DELETE' ? 'deleted this record' : 'updated this record'}
                      </p>
                      
                      {log.changes.length > 0 && (
                        <div className="mt-2 text-sm text-slate-400">
                          <ul className="space-y-2">
                            {log.changes.map((change, cIdx) => (
                              <li key={cIdx} className="bg-slate-800/50 p-2 rounded-md border border-slate-700/50">
                                <span className="font-semibold text-slate-300">{change.field}</span>
                                <div className="mt-1 flex items-center gap-2 flex-wrap">
                                  {log.action === 'UPDATE' && (
                                    <>
                                      <Badge variant="default" className="line-through opacity-70">
                                        {formatValue(change.oldValue)}
                                      </Badge>
                                      <span className="text-slate-500">&rarr;</span>
                                    </>
                                  )}
                                  <Badge variant="info">
                                    {formatValue(change.newValue)}
                                  </Badge>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="whitespace-nowrap text-right text-xs text-slate-500">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AuditTimeline;
