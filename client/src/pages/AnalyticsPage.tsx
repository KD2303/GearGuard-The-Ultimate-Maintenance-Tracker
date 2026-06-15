import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Treemap,
} from 'recharts';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { Link } from 'react-router-dom';
import { MaintenanceRequest } from '../types';
import toast from 'react-hot-toast';
import { requestService, AnalyticsResponse } from '../services/requestService';

type DateRange = '30d' | '90d' | 'custom';

const STAGE_COLORS: Record<string, string> = {
  new: '#3B82F6',
  'in-progress': '#F59E0B',
  repaired: '#10B981',
  scrap: '#EF4444',
};

const TYPE_COLORS: Record<string, string> = {
  corrective: '#8B5CF6',
  preventive: '#06B6D4',
};

const AnalyticsPage: React.FC = () => {
  const [range, setRange] = useState<DateRange>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  const [rcaData, setRcaData] = useState<any[]>([]);
  const [isRcaModalOpen, setIsRcaModalOpen] = useState(false);
  const [rcaModalRequests, setRcaModalRequests] = useState<MaintenanceRequest[]>([]);
  const [rcaLoading, setRcaLoading] = useState(false);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const query =
        range === 'custom'
          ? { range, startDate: customStartDate, endDate: customEndDate }
          : { range };

      const response = await requestService.getAnalytics(query);
      setData(response);

      if (range === '30d' || range === '90d' || range === 'custom') { // Fetching RCA only once initially or refreshing with same frequency
        const rcaRes = await requestService.getRootCauseAnalytics();
        setRcaData(rcaRes.children || []);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRcaNodeClick = async (e: any) => {
    if (e && e.requestIds && e.requestIds.length > 0) {
      setIsRcaModalOpen(true);
      setRcaLoading(true);
      try {
        const response = await requestService.getAll({ ids: e.requestIds.join(','), limit: 100 });
        setRcaModalRequests(response.items);
      } catch(error) {
        toast.error('Failed to load related work orders');
      } finally {
        setRcaLoading(false);
      }
    }
  };

  useEffect(() => {
    if (range !== 'custom') {
      loadAnalytics();
    }
  }, [range]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const canApplyCustom = useMemo(() => {
    if (range !== 'custom') return true;
    return Boolean(customStartDate && customEndDate);
  }, [range, customStartDate, customEndDate]);

  const stageChartData = useMemo(
    () =>
      (data?.charts.stageBreakdown || []).map((item) => ({
        name: item.stage,
        value: item.value,
        color: STAGE_COLORS[item.stage] || '#6366F1',
      })),
    [data]
  );

  const typeChartData = useMemo(
    () =>
      (data?.charts.typeBreakdown || []).map((item) => ({
        name: item.type,
        value: item.value,
        color: TYPE_COLORS[item.type] || '#14B8A6',
      })),
    [data]
  );

  const trendChartData = useMemo(
    () =>
      (data?.charts.trend || []).map((item) => ({
        ...item,
        label: new Date(item.date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
      })),
    [data]
  );

  const costByCategoryData = useMemo(
    () => data?.charts.costByCategory || [],
    [data]
  );

  const costByDepartmentData = useMemo(
    () => data?.charts.costByDepartment || [],
    [data]
  );

  const topExpensiveMachinesData = useMemo(
    () => data?.charts.topExpensiveMachines || [],
    [data]
  );

  if (loading) {
    return <Spinner size="lg" label="Loading analytics..." centered />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Track request health, resolution speed, and overdue risk.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
              Date range
            </label>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as DateRange)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {range === 'custom' && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Start
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                  End
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
              <button
                onClick={loadAnalytics}
                disabled={!canApplyCustom}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total requests</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {data?.metrics.totalRequests ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">MTTR (hours)</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {data?.metrics.mttrHours ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Overdue rate</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {data?.metrics.overdueRate ?? 0}%
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm dark:border-red-900/50 dark:bg-red-900/10">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center">
            <span className="mr-1">💸</span> Financial Bleed
          </p>
          <p className="mt-2 text-3xl font-bold text-red-700 dark:text-red-300">
            ${data?.metrics.totalFinancialLoss?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm dark:border-green-900/50 dark:bg-green-900/10">
          <p className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center">
            <span className="mr-1">💰</span> Money Saved (ROI)
          </p>
          <p className="mt-2 text-3xl font-bold text-green-700 dark:text-green-300">
            ${data?.metrics.moneySaved?.toLocaleString() || '0'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Status distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stageChartData} dataKey="value" nameKey="name" outerRadius={95}>
                  {stageChartData.map((entry, index) => (
                    <Cell key={`stage-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Requests by type</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {typeChartData.map((entry, index) => (
                    <Cell key={`type-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 mt-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Request trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={false} />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-red-100 bg-white p-5 shadow-sm dark:border-red-900/30 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <span className="mr-2">📉</span> Cost by Category
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costByCategoryData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(val) => `$${val}`} />
                <YAxis type="category" dataKey="category" width={80} />
                <Tooltip formatter={(value: any) => [`$${value}`, 'Lost Revenue']} />
                <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 mt-6">
        <div className="rounded-xl border border-rose-100 bg-white p-5 shadow-sm dark:border-rose-900/30 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <span className="mr-2">🔥</span> Top 5 Expensive Machines
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topExpensiveMachinesData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(val) => `$${val}`} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(value: any) => [`$${value}`, 'Downtime Cost']} />
                <Bar dataKey="value" fill="#fb7185" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm dark:border-orange-900/30 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <span className="mr-2">🏢</span> Cost by Department
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={costByDepartmentData} dataKey="value" nameKey="department" outerRadius={95} label>
                  {costByDepartmentData.map((entry, index) => (
                    <Cell key={`dept-${index}`} fill={['#f97316', '#eab308', '#84cc16', '#14b8a6', '#6366f1', '#d946ef'][index % 6]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`$${value}`, 'Lost Revenue']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-indigo-100 bg-white p-5 shadow-sm dark:border-indigo-900/30 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="mr-2">🔍</span> Root Cause Analysis (By Equipment Category)
        </h3>
        <p className="text-sm text-gray-500 mb-4">Click on any block to view associated work orders</p>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={rcaData}
              dataKey="value"
              aspectRatio={4 / 3}
              stroke="#fff"
              fill="#8884d8"
              onClick={handleRcaNodeClick}
              isAnimationActive={false}
            >
              <Tooltip formatter={(value: any, name: any, props: any) => [
                `${value} Work Orders`, 
                props.payload?.name || props.name
              ]} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </div>

      <Modal isOpen={isRcaModalOpen} onClose={() => setIsRcaModalOpen(false)} title="Associated Work Orders" size="lg">
        {rcaLoading ? (
          <div className="p-8 flex justify-center"><Spinner /></div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-3">
            {rcaModalRequests.length === 0 ? (
              <p className="text-gray-500">No work orders found.</p>
            ) : (
              rcaModalRequests.map(req => (
                <div key={req._id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{req.requestNumber} - {req.subject}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Root Cause: <span className="font-semibold">{req.rootCause}</span>
                    </p>
                  </div>
                  <Link to={`/kanban?request=${req._id}`} className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                    View Ticket &rarr;
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AnalyticsPage;
