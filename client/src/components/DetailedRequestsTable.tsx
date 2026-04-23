import { useState, useEffect } from 'react';
import { MaintenanceRequest } from '../types';
import { requestService } from '../services/requestService';
import Badge from './Badge';
import { 
  Calendar, 
  AlertCircle, 
  Clock, 
  User, 
  Package,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const DetailedRequestsTable = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await requestService.getAll();
      setRequests(data);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRequests = [...requests].sort((a, b) => {
    let aValue: any = a[sortField as keyof MaintenanceRequest];
    let bValue: any = b[sortField as keyof MaintenanceRequest];

    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;

    if (typeof aValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-700';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'new': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700';
      case 'in-progress': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700';
      case 'repaired': return 'bg-green-100 dark:bg-green-900/30 text-green-700';
      case 'scrap': return 'bg-red-100 dark:bg-red-900/30 text-red-700';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200';
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <Clock className="w-4 h-4 text-gray-400" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Maintenance Requests</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Detailed view of all requests with full information</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-t border-gray-200 dark:border-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Date</span>
                  <SortIcon field="createdAt" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>Request ID</span>
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Priority</span>
                  <SortIcon field="priority" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={() => handleSort('stage')}
              >
                <div className="flex items-center space-x-1">
                  <Settings className="w-4 h-4" />
                  <span>Stage</span>
                  <SortIcon field="stage" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <Package className="w-4 h-4" />
                  <span>Equipment</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>Assigned To</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider pr-8">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
            {sortedRequests.map((request) => (
              <>
                <tr
                  key={request.id}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors duration-200 cursor-pointer"
                  onClick={() => setExpandedRow(expandedRow === request.id ? null : request.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {request.createdAt
                      ? new Date(request.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{request.requestNumber}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{request.subject}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(request.priority)}`}>
                      {request.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(request.stage)}`}>
                      {request.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {request.equipment?.name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {request.assignedTo?.name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={request.type === 'corrective' ? 'warning' : 'info'} size="sm">
                      {request.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <button className="text-blue-600 hover:text-blue-900 transition-colors duration-200">
                      {expandedRow === request.id ? 'Collapse' : 'Expand'}
                    </button>
                  </td>
                </tr>
                {expandedRow === request.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={8} className="px-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Description</div>
                          <div className="text-sm text-gray-900 dark:text-white mt-1">
                            {request.description || 'No description'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Scheduled Date</div>
                          <div className="text-sm text-gray-900 dark:text-white mt-1">
                            {request.scheduledDate
                              ? new Date(request.scheduledDate).toLocaleDateString()
                              : 'Not scheduled'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Team</div>
                          <div className="text-sm text-gray-900 dark:text-white mt-1">
                            {request.team?.name || 'Unassigned'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Duration</div>
                          <div className="text-sm text-gray-900 dark:text-white mt-1">
                            {request.duration ? `${request.duration} hrs` : 'TBD'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Cost</div>
                          <div className="text-sm text-gray-900 dark:text-white mt-1">
                            {request.cost ? `$${request.cost}` : 'TBD'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Completed Date</div>
                          <div className="text-sm text-gray-900 dark:text-white mt-1">
                            {request.completedDate
                              ? new Date(request.completedDate).toLocaleDateString()
                              : 'Not completed'}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Notes</div>
                          <div className="text-sm text-gray-900 dark:text-white mt-1">
                            {request.notes || 'No notes'}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>

        {sortedRequests.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No requests found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new maintenance request.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailedRequestsTable;
