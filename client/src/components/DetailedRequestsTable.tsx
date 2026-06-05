import { useState, useEffect, Fragment } from "react";
import { MaintenanceRequest } from "../types";
import { requestService } from "../services/requestService";
import { getRelativeDateLabel } from "../utils/dateUtils";
import AuditTimeline from "./AuditTimeline";

import Badge from "./Badge";
import Button from "./Button";
import Spinner from "./Spinner";

// @ts-ignore
import Papa from "papaparse";

import {
  Calendar,
  AlertCircle,
  Clock,
  User,
  Package,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp,
  Edit2,
  Eye,
} from "lucide-react";

interface DetailedRequestsTableProps {
  onEdit?: (id: string) => void;
}

const DetailedRequestsTable: React.FC<DetailedRequestsTableProps> = ({ onEdit }) => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  type SortField = "createdAt" | "priority" | "stage";
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadRequests();
  }, [page, limit, sortField, sortDirection]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await requestService.getAll({
        page,
        limit,
        sortBy: sortField,
        sortOrder: sortDirection,
      });

      setRequests(data.items);
      setTotalItems(data.totalItems);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortValue = (request: MaintenanceRequest, field: SortField) => {
    if (field === "createdAt") {
      return request.createdAt
        ? new Date(request.createdAt).getTime()
        : undefined;
    }
    return request[field];
  };

  const sortedRequests = requests; // Already sorted by backend

  const handleExport = () => {
    if (!sortedRequests || sortedRequests.length === 0) return;

    const exportData = sortedRequests.map((request) => ({
      "Request Date": request.createdAt
        ? new Date(request.createdAt).toLocaleDateString("en-GB")
        : "",

      "Request ID": request.requestNumber || "",

      Subject: request.subject || "",

      Priority: request.priority || "",

      Stage: request.stage || "",

      Equipment: request.equipment?.name || "Unassigned",

      "Assigned To": request.assignedTo?.name || "Unassigned",

      Type: request.type || "",

      Description: request.description || "",

      "Scheduled Date": request.scheduledDate
        ? new Date(request.scheduledDate).toLocaleDateString("en-GB")
        : "",

      Team: request.team?.name || "Unassigned",

      Duration: request.duration ? `${request.duration} hrs` : "",

      Cost: request.cost ?? "",

      "Completed Date": request.completedDate
        ? new Date(request.completedDate).toLocaleDateString("en-GB")
        : "",

      Notes: request.notes || "",
    }));

    const csv = Papa.unparse(exportData);

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.setAttribute("download", "maintenance-requests.csv");

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-700/50";

      case "high":
        return "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200/50 dark:border-orange-700/50";

      case "medium":
        return "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-200/50 dark:border-yellow-700/50";

      case "low":
        return "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-700/50";

      default:
        return "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-600/50";
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "new":
        return "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50";

      case "in-progress":
        return "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-200/50 dark:border-yellow-700/50";

      case "repaired":
        return "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-700/50";

      case "scrap":
        return "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-700/50";

      default:
        return "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-600/50";
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <Clock className="w-4 h-4 text-gray-400" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 flex justify-center items-center h-[400px] transition-colors">
        <Spinner size="md" label="Loading requests..." />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 transition-colors border border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            All Maintenance Requests
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Detailed view of all requests with full information
          </p>
        </div>

        <Button onClick={handleExport}>Export CSV</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-t border-gray-200 dark:border-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("createdAt")}
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
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("priority")}
              >
                <div className="flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />

                  <span>Priority</span>

                  <SortIcon field="priority" />
                </div>
              </th>

              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("stage")}
              >
                <div className="flex items-center space-x-1">
                  <Settings className="w-4 h-4" />

                  <span>Stage</span>

                  <SortIcon field="stage" />
                </div>
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Equipment
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Assigned To
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Type
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedRequests.map((request) => (
              <Fragment key={request.id}>
                <tr
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer"
                  onClick={() =>
                    setExpandedRow(
                      expandedRow === request.id ? null : request.id,
                    )
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                    {request.createdAt
                      ? new Date(request.createdAt).toLocaleDateString()
                      : "N/A"}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {request.requestNumber}
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {request.subject}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                        request.priority,
                      )}`}
                    >
                      {request.priority}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(
                        request.stage,
                      )}`}
                    >
                      {request.stage}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                    {request.equipment?.name || "Unassigned"}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                    {request.assignedTo?.name || "Unassigned"}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        request.type === "corrective" ? "warning" : "info"
                      }
                      size="sm"
                    >
                      {request.type}
                    </Badge>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-3 items-center">
                    {onEdit && (
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           onEdit(request.id || request._id || '');
                         }}
                         className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-medium transition-colors"
                         title="Edit Request"
                       >
                         <Edit2 className="w-4 h-4 mr-1" />
                         Edit
                       </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedRow(expandedRow === request.id ? null : request.id);
                      }}
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium transition-colors"
                      title={expandedRow === request.id ? "Collapse Details" : "View Details"}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {expandedRow === request.id ? "Collapse" : "Expand"}
                    </button>
                  </td>
                </tr>

                {expandedRow === request.id && (
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    <td colSpan={8} className="px-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Description
                          </div>

                          <div className="text-sm text-gray-900 dark:text-gray-200 mt-1">
                            {request.description || "No description"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Scheduled Date
                          </div>

                          <div className="text-sm text-gray-900 dark:text-gray-200 mt-1 flex items-center">
                            {request.scheduledDate
                              ? new Date(
                                  request.scheduledDate,
                                ).toLocaleDateString()
                              : "Not scheduled"}
                            {request.scheduledDate && request.stage !== "repaired" && request.stage !== "scrap" && (
                              <span className={`ml-2 font-medium ${getRelativeDateLabel(request.scheduledDate).colorClass}`}>
                                {getRelativeDateLabel(request.scheduledDate).label}
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Team
                          </div>

                          <div className="text-sm text-gray-900 dark:text-gray-200 mt-1">
                            {request.team?.name || "Unassigned"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Duration
                          </div>

                          <div className="text-sm text-gray-900 dark:text-gray-200 mt-1">
                            {request.duration
                              ? `${request.duration} hrs`
                              : "TBD"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Request History</h4>
                        <div className="bg-slate-900 rounded-lg p-6 max-h-[400px] overflow-y-auto">
                          <AuditTimeline entityType="MaintenanceRequest" entityId={request.id || request._id || ''} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>

        {sortedRequests.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800">
            <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />

            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No requests found
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new maintenance request.
            </p>
          </div>
        )}
      </div>

      {!loading && totalItems > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <span>Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItems)} of {totalItems} results</span>
            <span className="mx-4">|</span>
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="ml-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1 transition-colors"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedRequestsTable;
