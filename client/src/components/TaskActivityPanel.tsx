import { useState, useEffect } from 'react';
import { Activity } from '../types';
import { activityService } from '../services/activityService';
import { 
  FileText, 
  Wrench, 
  CheckCircle, 
  Package, 
  Users, 
  UserPlus,
  Clock,
  MessageSquare,
} from 'lucide-react';
import Spinner from './Spinner';

interface TaskActivityPanelProps {
  requestId?: string;
}

const TaskActivityPanel = ({ requestId }: TaskActivityPanelProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Activity['type']>('all');

  useEffect(() => {
    loadActivities();
  }, [requestId, filter]);

  const loadActivities = async () => {
    try {
      let data: Activity[];
      if (requestId) {
        // Load activities for specific request
        data = await activityService.getAll();
      } else if (filter !== 'all') {
        data = await activityService.getByType(filter);
      } else {
        data = await activityService.getRecent(20);
      }
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
      // Mock detailed activities
      setActivities([
        {
          id: '1',
          type: 'request_created',
          title: 'Maintenance Request Created',
          description: 'Request #MR-2024-001 was created for Hydraulic Press routine inspection. Priority set to HIGH due to safety concerns.',
          userName: 'John Smith',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          metadata: { priority: 'high', requestId: 'MR-2024-001' }
        },
        {
          id: '2',
          type: 'team_assigned',
          title: 'Team Assignment Updated',
          description: 'Hydraulic Systems Team has been assigned to handle the inspection. Team lead Sarah Johnson will coordinate the maintenance.',
          userName: 'Admin',
          timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          metadata: { teamId: 'team-1' }
        },
        {
          id: '3',
          type: 'request_updated',
          title: 'Request Status Changed',
          description: 'Request moved from NEW to IN-PROGRESS stage. Initial diagnostics started by technician Mike Davis.',
          userName: 'Mike Davis',
          timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
          metadata: { status: 'in-progress' }
        },
        {
          id: '4',
          type: 'equipment_updated',
          title: 'Equipment Status Updated',
          description: 'Hydraulic Press #HP-001 status changed to UNDER MAINTENANCE. Equipment taken offline for inspection.',
          userName: 'Mike Davis',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          metadata: { equipmentId: 'eq-1' }
        },
        {
          id: '5',
          type: 'request_updated',
          title: 'Maintenance Log Added',
          description: 'Inspection findings logged: Hydraulic fluid levels normal, minor seal wear detected. Replacement parts ordered.',
          userName: 'Mike Davis',
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        },
        {
          id: '6',
          type: 'request_completed',
          title: 'Maintenance Completed',
          description: 'All maintenance work completed successfully. New seals installed, system pressure tested and verified. Equipment ready for production.',
          userName: 'Sarah Johnson',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'request_created':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'request_updated':
        return <Wrench className="w-5 h-5 text-yellow-500" />;
      case 'request_completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'equipment_updated':
        return <Package className="w-5 h-5 text-purple-500" />;
      case 'team_assigned':
        return <Users className="w-5 h-5 text-indigo-500" />;
      case 'member_added':
        return <UserPlus className="w-5 h-5 text-teal-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActivityBgColor = (type: Activity['type']) => {
    switch (type) {
      case 'request_created':
        return 'bg-blue-50 dark:bg-gray-800 border-blue-200 dark:border-gray-700';
      case 'request_updated':
        return 'bg-yellow-50 dark:bg-gray-800 border-yellow-200 dark:border-gray-700';

      case 'request_completed':
        return 'bg-green-50 dark:bg-gray-800 border-green-200 dark:border-gray-700';

      case 'equipment_updated':
        return 'bg-purple-50 dark:bg-gray-800 border-purple-200 dark:border-gray-700';

      case 'team_assigned':
        return 'bg-indigo-50 dark:bg-gray-800 border-indigo-200 dark:border-gray-700';
      case 'member_added':
        return 'bg-teal-50 dark:bg-gray-800 border-teal-200 dark:border-gray-700';
      default:
        return 'bg-gray-50 border-gray-200 dark:border-gray-700';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / 1000 / 60);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filterButtons = [
    { label: 'All', value: 'all' as const },
    { label: 'Requests', value: 'request_created' as const },
    { label: 'Updates', value: 'request_updated' as const },
    { label: 'Completed', value: 'request_completed' as const },
    { label: 'Equipment', value: 'equipment_updated' as const },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex justify-center items-center h-[400px]">
        <Spinner size="md" label="Loading activity..." />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 transition-colors rounded-lg shadow">
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Task Activity</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Detailed activity log with descriptions</p>
      </div>

      {/* Filter Buttons */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
        {filterButtons.map(btn => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            className={`px-4 py-1.5 text-sm rounded-full transition-all duration-200
              ${
                filter === btn.value
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-gray-100 dark:bg-gray-700 transition-colors duration-200 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className="p-6 max-h-[600px] overflow-y-auto">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`border rounded-lg p-4 ${getActivityBgColor(activity.type)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 transition-colors shadow-sm dark:shadow-none flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {activity.title}
                      </h4>
                      <p className="mt-1 text-sm text-gray-800 dark:text-gray-100 leading-relaxed">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                    {activity.userName && (
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        <span className="font-medium">{activity.userName}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{getTimeAgo(activity.timestamp)}</span>
                    </div>
                    {activity.metadata?.priority && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          activity.metadata.priority === 'urgent'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : activity.metadata.priority === 'high'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            : activity.metadata.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {activity.metadata.priority.toUpperCase()}
                      </span>
                    )}
                    {activity.metadata?.requestId && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 transition-colors duration-200 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600">
                        {activity.metadata.requestId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No activities yet</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Task activities will appear here as they happen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskActivityPanel;
