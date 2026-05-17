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
} from 'recharts';
import Spinner from '../components/Spinner';
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

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const query =
        range === 'custom'
          ? { range, startDate: customStartDate, endDate: customEndDate }
          : { range };

      const response = await requestService.getAnalytics(query);
      setData(response);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
    </div>
  );
};

export default AnalyticsPage;
