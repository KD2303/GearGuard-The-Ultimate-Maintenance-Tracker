"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var requestService_1 = require("../services/requestService");
var dateUtils_1 = require("../utils/dateUtils");
var AuditTimeline_1 = require("./AuditTimeline");
var Badge_1 = require("./Badge");
var Button_1 = require("./Button");
var Spinner_1 = require("./Spinner");
// @ts-ignore
var papaparse_1 = require("papaparse");
var lucide_react_1 = require("lucide-react");
var DetailedRequestsTable = function (_a) {
    var onEdit = _a.onEdit;
    var _b = (0, react_1.useState)([]), requests = _b[0], setRequests = _b[1];
    var _c = (0, react_1.useState)(true), loading = _c[0], setLoading = _c[1];
    var _d = (0, react_1.useState)("createdAt"), sortField = _d[0], setSortField = _d[1];
    var _e = (0, react_1.useState)("desc"), sortDirection = _e[0], setSortDirection = _e[1];
    var _f = (0, react_1.useState)(null), expandedRow = _f[0], setExpandedRow = _f[1];
    var _g = (0, react_1.useState)(1), page = _g[0], setPage = _g[1];
    var _h = (0, react_1.useState)(20), limit = _h[0], setLimit = _h[1];
    var _j = (0, react_1.useState)(0), totalItems = _j[0], setTotalItems = _j[1];
    var _k = (0, react_1.useState)(1), totalPages = _k[0], setTotalPages = _k[1];
    (0, react_1.useEffect)(function () {
        loadRequests();
    }, [page, limit, sortField, sortDirection]);
    var loadRequests = function () { return __awaiter(void 0, void 0, void 0, function () {
        var data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, requestService_1.requestService.getAll({
                            page: page,
                            limit: limit,
                            sortBy: sortField,
                            sortOrder: sortDirection,
                        })];
                case 2:
                    data = _a.sent();
                    setRequests(data.items);
                    setTotalItems(data.totalItems);
                    setTotalPages(data.totalPages);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error("Failed to load requests:", error_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleSort = function (field) {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        }
        else {
            setSortField(field);
            setSortDirection("asc");
        }
    };
    var getSortValue = function (request, field) {
        if (field === "createdAt") {
            return request.createdAt
                ? new Date(request.createdAt).getTime()
                : undefined;
        }
        return request[field];
    };
    var sortedRequests = requests; // Already sorted by backend
    var handleExport = function () {
        if (!sortedRequests || sortedRequests.length === 0)
            return;
        var exportData = sortedRequests.map(function (request) {
            var _a, _b, _c, _d;
            return ({
                "Request Date": request.createdAt
                    ? new Date(request.createdAt).toLocaleDateString("en-GB")
                    : "",
                "Request ID": request.requestNumber || "",
                Subject: request.subject || "",
                Priority: request.priority || "",
                Stage: request.stage || "",
                Equipment: ((_a = request.equipment) === null || _a === void 0 ? void 0 : _a.name) || "Unassigned",
                "Assigned To": ((_b = request.assignedTo) === null || _b === void 0 ? void 0 : _b.name) || "Unassigned",
                Type: request.type || "",
                Description: request.description || "",
                "Scheduled Date": request.scheduledDate
                    ? new Date(request.scheduledDate).toLocaleDateString("en-GB")
                    : "",
                Team: ((_c = request.team) === null || _c === void 0 ? void 0 : _c.name) || "Unassigned",
                Duration: request.duration ? "".concat(request.duration, " hrs") : "",
                Cost: (_d = request.cost) !== null && _d !== void 0 ? _d : "",
                "Completed Date": request.completedDate
                    ? new Date(request.completedDate).toLocaleDateString("en-GB")
                    : "",
                Notes: request.notes || "",
            });
        });
        var csv = papaparse_1.default.unparse(exportData);
        var blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;",
        });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "maintenance-requests.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    var getPriorityColor = function (priority) {
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
    var getStageColor = function (stage) {
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
    var SortIcon = function (_a) {
        var field = _a.field;
        if (sortField !== field)
            return <lucide_react_1.Clock className="w-4 h-4 text-gray-400"/>;
        return sortDirection === "asc" ? (<lucide_react_1.ChevronUp className="w-4 h-4 text-blue-600"/>) : (<lucide_react_1.ChevronDown className="w-4 h-4 text-blue-600"/>);
    };
    if (loading) {
        return (<div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 flex justify-center items-center h-[400px] transition-colors">
        <Spinner_1.default size="md" label="Loading requests..."/>
      </div>);
    }
    return (<div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 transition-colors border border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            All Maintenance Requests
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Detailed view of all requests with full information
          </p>
        </div>

        <Button_1.default onClick={handleExport}>Export CSV</Button_1.default>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-t border-gray-200 dark:border-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={function () { return handleSort("createdAt"); }}>
                <div className="flex items-center space-x-1">
                  <lucide_react_1.Calendar className="w-4 h-4"/>

                  <span>Date</span>

                  <SortIcon field="createdAt"/>
                </div>
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <lucide_react_1.FileText className="w-4 h-4"/>

                  <span>Request ID</span>
                </div>
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={function () { return handleSort("priority"); }}>
                <div className="flex items-center space-x-1">
                  <lucide_react_1.AlertCircle className="w-4 h-4"/>

                  <span>Priority</span>

                  <SortIcon field="priority"/>
                </div>
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={function () { return handleSort("stage"); }}>
                <div className="flex items-center space-x-1">
                  <lucide_react_1.Settings className="w-4 h-4"/>

                  <span>Stage</span>

                  <SortIcon field="stage"/>
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
            {sortedRequests.map(function (request) {
            var _a, _b, _c;
            return (<react_1.Fragment key={request.id}>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer" onClick={function () {
                    return setExpandedRow(expandedRow === request.id ? null : request.id);
                }}>
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
                    <span className={"px-2 py-1 text-xs font-medium rounded-full ".concat(getPriorityColor(request.priority))}>
                      {request.priority}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={"px-2 py-1 text-xs font-medium rounded-full ".concat(getStageColor(request.stage))}>
                      {request.stage}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                    {((_a = request.equipment) === null || _a === void 0 ? void 0 : _a.name) || "Unassigned"}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                    {((_b = request.assignedTo) === null || _b === void 0 ? void 0 : _b.name) || "Unassigned"}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge_1.default variant={request.type === "corrective" ? "warning" : "info"} size="sm">
                      {request.type}
                    </Badge_1.default>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-3 items-center">
                    {onEdit && (<button onClick={function (e) {
                        e.stopPropagation();
                        onEdit(request.id || request._id || '');
                    }} className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-medium transition-colors" title="Edit Request">
                         <lucide_react_1.Edit2 className="w-4 h-4 mr-1"/>
                         Edit
                       </button>)}
                    <button onClick={function (e) {
                    e.stopPropagation();
                    setExpandedRow(expandedRow === request.id ? null : request.id);
                }} className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium transition-colors" title={expandedRow === request.id ? "Collapse Details" : "View Details"}>
                      <lucide_react_1.Eye className="w-4 h-4 mr-1"/>
                      {expandedRow === request.id ? "Collapse" : "Expand"}
                    </button>
                  </td>
                </tr>

                {expandedRow === request.id && (<tr className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
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
                        ? new Date(request.scheduledDate).toLocaleDateString()
                        : "Not scheduled"}
                            {request.scheduledDate && request.stage !== "repaired" && request.stage !== "scrap" && (<span className={"ml-2 font-medium ".concat((0, dateUtils_1.getRelativeDateLabel)(request.scheduledDate).colorClass)}>
                                {(0, dateUtils_1.getRelativeDateLabel)(request.scheduledDate).label}
                              </span>)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Team
                          </div>

                          <div className="text-sm text-gray-900 dark:text-gray-200 mt-1">
                            {((_c = request.team) === null || _c === void 0 ? void 0 : _c.name) || "Unassigned"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Duration
                          </div>

                          <div className="text-sm text-gray-900 dark:text-gray-200 mt-1">
                            {request.duration
                        ? "".concat(request.duration, " hrs")
                        : "TBD"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Request History</h4>
                        <div className="bg-slate-900 rounded-lg p-6 max-h-[400px] overflow-y-auto">
                          <AuditTimeline_1.default entityType="MaintenanceRequest" entityId={request.id || request._id || ''}/>
                        </div>
                      </div>
                    </td>
                  </tr>)}
              </react_1.Fragment>);
        })}
          </tbody>
        </table>

        {sortedRequests.length === 0 && (<div className="text-center py-12 bg-white dark:bg-gray-800">
            <lucide_react_1.FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"/>

            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No requests found
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new maintenance request.
            </p>
          </div>)}
      </div>

      {!loading && totalItems > 0 && (<div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <span>Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItems)} of {totalItems} results</span>
            <span className="mx-4">|</span>
            <span>Rows per page:</span>
            <select value={limit} onChange={function (e) {
                setLimit(Number(e.target.value));
                setPage(1);
            }} className="ml-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1 transition-colors">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Button_1.default variant="secondary" size="sm" onClick={function () { return setPage(function (p) { return Math.max(1, p - 1); }); }} disabled={page === 1}>
              Previous
            </Button_1.default>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>
            <Button_1.default variant="secondary" size="sm" onClick={function () { return setPage(function (p) { return Math.min(totalPages, p + 1); }); }} disabled={page === totalPages}>
              Next
            </Button_1.default>
          </div>
        </div>)}
    </div>);
};
exports.default = DetailedRequestsTable;
