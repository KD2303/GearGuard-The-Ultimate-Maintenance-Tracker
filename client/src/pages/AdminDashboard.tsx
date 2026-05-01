import React, { useEffect, useState } from 'react';
import { MetricsCard } from '../components/MetricsCard';
import { MaintenanceTrendChart } from '../components/MaintenanceTrendChart';
import { AlertsPanel } from '../components/AlertsPanel';
import { adminService } from '../services/adminService';
import {
  Plus,
  Wrench,
  UserPlus,
  FileText,
  RefreshCcw,
  History,
  Moon,
  Sun
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import EquipmentModal from '../components/EquipmentModal';
import RequestModal from '../components/RequestModal';
import MemberModal from '../components/MemberModal';

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [recent, setRecent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const fetchData = async () => {
    try {
      const [m, a, al, r] = await Promise.all([
        adminService.getMetrics(),
        adminService.getAnalytics(),
        adminService.getAlerts(),
        adminService.getRecentActivity()
      ]);
      setMetrics(m);
      setAnalytics(a);
      setAlerts(al);
      setRecent(r);
    } catch (error) {
      toast.error('Failed to refresh dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  const handleGenerateReport = () => {
    if (!metrics || !recent) {
      toast.error('No data available to generate report');
      return;
    }

    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          // Prepare CSV data
          const headers = ['Category', 'Metric', 'Value'];
          const rows = [
            ['Summary', 'Total Equipment', metrics.totalEquipment.value],
            ['Summary', 'Active Requests', metrics.activeRequests.value],
            ['Summary', 'System Availability', `${metrics.availability.value}%`],
            ['Summary', 'Team Utilization', `${metrics.utilizationPercentage.value}%`],
            ['Summary', 'Overdue Count', metrics.overdueCount.value],
            [],
            ['Type', 'Entity Name', 'Last Action', 'Date'],
            ...recent.recentRequests.map((r: any) => [
              'Maintenance', 
              r.equipmentId?.name || 'Request', 
              'Repaired', 
              format(new Date(r.updatedAt), 'yyyy-MM-dd')
            ]),
            ...recent.recentEquipment.map((e: any) => [
              'Inventory', 
              e.name, 
              'Added', 
              format(new Date(e.createdAt), 'yyyy-MM-dd')
            ])
          ];

          const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map((cell: any) => `"${cell}"`).join(','))
          ].join('\n');

          // Download Logic
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', `GearGuard_Status_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          resolve(true);
        }, 1500);
      }),
      {
        loading: 'Compiling dashboard data...',
        success: 'Report downloaded successfully!',
        error: 'Failed to generate CSV',
      }
    );
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="space-y-8 p-4 lg:p-8 rounded-3xl transition-colors duration-500 bg-transparent dark:bg-gray-950/40">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-300 mt-1">System health and maintenance overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 1. Key Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
        <MetricsCard
          title="Total Equipment"
          value={metrics?.totalEquipment.value || 0}
          trend={metrics?.totalEquipment.trend}
        />
        <MetricsCard
          title="Active Requests"
          value={metrics?.activeRequests.value || 0}
          trend={metrics?.activeRequests.trend}
        />
        <MetricsCard
          title="Team Utilization"
          value={metrics?.utilizationPercentage.value || 0}
          suffix="%"
          trend={metrics?.utilizationPercentage.trend}
        />
        <MetricsCard
          title="Overdue Requests"
          value={metrics?.overdueCount.value || 0}
          trend={metrics?.overdueCount.trend}
        />
        <MetricsCard
          title="Availability"
          value={metrics?.availability.value || 0}
          suffix="%"
          trend={metrics?.availability.trend}
        />
      </div>

      {/* 2. Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <button 
          onClick={() => setShowEquipmentModal(true)}
          className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-shadow shadow-md shadow-blue-500/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Equipment
        </button>
        <button 
          onClick={() => setShowRequestModal(true)}
          className="flex items-center px-4 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-shadow shadow-md shadow-purple-500/20"
        >
          <Wrench className="w-5 h-5 mr-2" />
          Maintenance Request
        </button>
        <button 
          onClick={() => setShowMemberModal(true)}
          className="flex items-center px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-shadow shadow-md shadow-emerald-500/20"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Assign Team Member
        </button>
        <button 
          onClick={handleGenerateReport}
          className="flex items-center px-4 py-2.5 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-shadow shadow-md shadow-amber-500/20"
        >
          <FileText className="w-5 h-5 mr-2" />
          Generate Report
        </button>
      </div>

      {/* 3. Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Maintenance Trend (Last 30 Days)</h3>
          <MaintenanceTrendChart data={analytics?.maintenanceTrend || []} type="line" isDark={isDark} />
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Equipment Status</h3>
          <MaintenanceTrendChart data={analytics?.statusDistribution || []} type="pie" isDark={isDark} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Team Workload</h3>
          <MaintenanceTrendChart data={analytics?.teamWorkload || []} type="bar" isDark={isDark} />
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Request Type Breakdown</h3>
          <MaintenanceTrendChart data={analytics?.typeBreakdown || []} type="stackedBar" isDark={isDark} />
        </div>
      </div>

      {/* 4. Alerts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AlertsPanel
            overdue={alerts?.overdue || []}
            dueSoon={alerts?.dueSoon || []}
            capacity={alerts?.capacityWarnings || []}
          />
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
              <History className="w-5 h-5 mr-2 text-primary" />
              Recent Activity
            </h3>
          </div>
          <div className="p-5 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-3">
                  <th className="pb-3 px-4">Entity</th>
                  <th className="pb-3 px-4">Action</th>
                  <th className="pb-3 px-4">Date</th>
                  <th className="pb-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                {recent?.recentRequests.map((req: any) => (
                  <tr key={req._id} className="text-sm hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">{req.equipmentId?.name || 'Request'}</td>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-300">Maintenance Completed</td>
                    <td className="py-4 px-4 text-gray-500 dark:text-gray-300">{format(new Date(req.updatedAt), 'MMM dd')}</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">REPAIRED</span>
                    </td>
                  </tr>
                ))}
                {recent?.recentEquipment.map((eq: any) => (
                  <tr key={eq._id} className="text-sm hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">{eq.name}</td>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-300">Equipment Added</td>
                    <td className="py-4 px-4 text-gray-500 dark:text-gray-300">{format(new Date(eq.createdAt), 'MMM dd')}</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">NEW</span>
                    </td>
                  </tr>
                ))}
                {recent?.recentTeamChanges?.map((activity: any) => (
                  <tr key={activity._id} className="text-sm hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">{activity.title}</td>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-300">{activity.description}</td>
                    <td className="py-4 px-4 text-gray-500 dark:text-gray-300">{format(new Date(activity.createdAt), 'MMM dd')}</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase">TEAM</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EquipmentModal 
        isOpen={showEquipmentModal} 
        onClose={() => setShowEquipmentModal(false)}
        onSuccess={() => {
          setShowEquipmentModal(false);
          fetchData();
          toast.success('Equipment created successfully');
        }}
      />
      <RequestModal 
        isOpen={showRequestModal} 
        onClose={() => setShowRequestModal(false)}
        onSuccess={() => {
          setShowRequestModal(false);
          fetchData();
          toast.success('Maintenance request created');
        }}
      />
      <MemberModal 
        isOpen={showMemberModal} 
        onClose={() => setShowMemberModal(false)}
        onSuccess={() => {
          setShowMemberModal(false);
          fetchData();
          toast.success('Team member added');
        }}
      />
      </div>
    </div>
  );
};

export default AdminDashboard;
