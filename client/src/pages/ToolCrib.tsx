import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Wrench, Search, SearchX } from 'lucide-react';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';
import { Tool } from '../types';
import toast from 'react-hot-toast';
import api from '../services/api';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

const ToolCrib: React.FC = () => {
  const { t } = useTranslation();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseCost, setPurchaseCost] = useState<number>(0);
  const [lockedTools, setLockedTools] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTools();

    const socket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('gearguard_token') }
    });

    socket.on('tools_changed', () => {
      fetchTools();
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
  }, []);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tools');
      if (res.data) {
        setTools(res.data);
      }
    } catch (error: any) {
      toast.error('Failed to load tools: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/tools', {
        name,
        serialNumber,
        purchaseCost
      });
      if (res.data) {
        toast.success(t('tools.addSuccess'));
        setIsModalOpen(false);
        fetchTools();
        setName('');
        setSerialNumber('');
        setPurchaseCost(0);
      }
    } catch (error: any) {
      toast.error('Failed to create tool: ' + error.message);
    }
  };

  const filteredTools = tools.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'success';
      case 'Checked Out': return 'warning';
      case 'In Repair': return 'danger';
      case 'Lost': return 'default';
      default: return 'primary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Wrench className="h-6 w-6 mr-2 text-indigo-500" />
            Tool Crib
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage highly specialized and shared maintenance tools.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" />
          Add New Tool
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white sm:text-sm"
              placeholder="Search tools by name or serial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
            <SearchX className="h-12 w-12 mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium">No tools found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tool Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Serial Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purchase Cost</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {filteredTools.map((tool) => (
                  <tr key={tool._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {tool.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {tool.serialNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {lockedTools.has(tool._id || '') ? (
                         <Badge variant="warning">Locking...</Badge>
                      ) : (
                         <Badge variant={getStatusColor(tool.status)}>{tool.status}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      ${tool.purchaseCost?.toLocaleString() || '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add New Tool</h3>
            <form onSubmit={handleCreateTool} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tool Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serial Number</label>
                <input
                  type="text"
                  required
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Cost ($)</label>
                <input
                  type="number"
                  min="0"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Create Tool</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolCrib;
