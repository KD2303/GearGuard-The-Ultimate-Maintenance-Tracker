import { useState, useEffect, Fragment } from "react";
import { MaintenanceRequest } from "../types";
import { requestService } from "../services/requestService";

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
} from "lucide-react";

const DetailedRequestsTable = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);

  const [loading, setLoading] = useState(true);
  type SortField = "createdAt" | "priority" | "stage";

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await requestService.getAll();

      setRequests(data);
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

  const sortedRequests = [...requests].sort((a, b) => {
    const aValue = getSortValue(a, sortField);
    const bValue = getSortValue(b, sortField);

    if (aValue === undefined) return 1;

    if (bValue === undefined) return -1;

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === "asc"
      ? (aValue ?? 0) - (bValue ?? 0)
      : (bValue ?? 0) - (aValue ?? 0);
  });

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
        return "bg-red-100 text-red-700";

      case "high":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700";

      case "medium":
        return "bg-yellow-100 text-yellow-700";

      case "low":
        return "bg-green-100 text-green-700";

      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700";
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "new":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700";

      case "in-progress":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700";

      case "repaired":
        return "bg-green-100 dark:bg-green-900/30 text-green-700";

      case "scrap":
        return "bg-red-100 dark:bg-red-900/30 text-red-700";

      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700";
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
      <div className="bg-white rounded-lg shadow p-6 flex justify-center items-center h-[400px]">
        <Spinner size="md" label="Loading requests..." />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
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

          <tbody className="bg-white divide-y divide-gray-200">
            {sortedRequests.map((request) => (
              <Fragment key={request.id}>
                <tr
                  className="hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors duration-200 cursor-pointer"
                  onClick={() =>
                    setExpandedRow(
                      expandedRow === request.id ? null : request.id,
                    )
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
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

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {request.equipment?.name || "Unassigned"}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
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

                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-600 hover:text-blue-900">
                      {expandedRow === request.id ? "Collapse" : "Expand"}
                    </button>
                  </td>
                </tr>

                {expandedRow === request.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={8} className="px-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs font-medium text-gray-500">
                            Description
                          </div>

                          <div className="text-sm text-gray-900 mt-1">
                            {request.description || "No description"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500">
                            Scheduled Date
                          </div>

                          <div className="text-sm text-gray-900 mt-1">
                            {request.scheduledDate
                              ? new Date(
                                  request.scheduledDate,
                                ).toLocaleDateString()
                              : "Not scheduled"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500">
                            Team
                          </div>

                          <div className="text-sm text-gray-900 mt-1">
                            {request.team?.name || "Unassigned"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500">
                            Duration
                          </div>

                          <div className="text-sm text-gray-900 mt-1">
                            {request.duration
                              ? `${request.duration} hrs`
                              : "TBD"}
                          </div>
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
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />

            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No requests found
            </h3>

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
