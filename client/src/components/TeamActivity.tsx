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
  Clock
} from 'lucide-react';

const TeamActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const data = await activityService.getRecent(15);
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
      // Mock data for development
      setActivities([
        {
          id: '1',
          type: 'request_created',
          title: 'New Maintenance Request',
          description: 'Hydraulic Press - Routine inspection required',
          userName: 'John Smith',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          metadata: { priority: 'high' }
        },
        {
          id: '2',
          type: 'request_completed',
          title: 'Request Completed',
          description: 'CNC Machine #3 - Maintenance completed successfully',
          userName: 'Sarah Johnson',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        },
        {
          id: '3',
          type: 'equipment_updated',
          title: 'Equipment Status Changed',
          description: 'Laser Cutter A1 - Status changed to active',
          userName: 'Mike Davis',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        },
        {
          id: '4',
          type: 'team_assigned',
          title: 'Team Assignment',
          description: 'Electrical Team assigned to Generator #2',
          userName: 'Admin',
          timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        },
        {
          id: '5',
          type: 'member_added',
          title: 'New Team Member',
          description: 'Alex Martinez joined Mechanical Team',
          userName: 'Admin',
          timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
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
        return <FileText className="w-5 h-5 text-gray-500" />;
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

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 transition-colors rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200
                  hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200
                    hover:bg-gray-200 dark:hover:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200
                    hover:bg-gray-200 dark:hover:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 transition-colors rounded-lg shadow">
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Activity</h2>
        <p className="text-sm text-gray-500 mt-1">Recent actions and updates</p>
      </div>

      <div className="p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((activity, idx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {idx !== activities.length - 1 && (
                    <span
                      className="absolute left-5 top-5 -ml-px h-full w-0.5  dark:bg-gray-700 
                      text-gray-800 dark:text-gray-200
                      hover:bg-gray-200 dark:hover:bg-gray-600"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center ring-8 ring-white">
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900 dark:text-white">{activity.title}</span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">{activity.description}</p>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        {activity.userName && (
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {activity.userName}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {getTimeAgo(activity.timestamp)}
                        </div>
                        {activity.metadata?.priority && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              activity.metadata.priority === 'urgent'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700'
                                : activity.metadata.priority === 'high'
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700'
                                : activity.metadata.priority === 'medium'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-700'
                            }`}
                          >
                            {activity.metadata.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {activities.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No activities yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Team activities will appear here as they happen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamActivity;
