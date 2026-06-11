"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var types_1 = require("../types");
var api_1 = require("../services/api");
var FilterBar = function (_a) {
    var filters = _a.filters, setFilters = _a.setFilters, resultCount = _a.resultCount;
    var _b = (0, react_1.useState)([]), members = _b[0], setMembers = _b[1];
    var _c = (0, react_1.useState)(filters.search), searchInput = _c[0], setSearchInput = _c[1];
    (0, react_1.useEffect)(function () {
        var fetchMembers = function () { return __awaiter(void 0, void 0, void 0, function () {
            var res, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, api_1.default.get('/members')];
                    case 1:
                        res = _a.sent();
                        setMembers(res.data);
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        console.error('Failed to load members', err_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        fetchMembers();
    }, []);
    // 300ms debounce on search input
    (0, react_1.useEffect)(function () {
        var timer = setTimeout(function () {
            setFilters(__assign(__assign({}, filters), { search: searchInput }));
        }, 300);
        return function () { return clearTimeout(timer); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput]);
    var handleChange = function (key, value) {
        var _a;
        setFilters(__assign(__assign({}, filters), (_a = {}, _a[key] = value, _a)));
    };
    var handleClear = function () {
        setFilters(types_1.defaultFilters);
        setSearchInput('');
    };
    var activeFilterCount = Object.values(filters).filter(function (v) { return v !== ''; }).length;
    return (<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6 shadow-sm dark:shadow-gray-900/50 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Filters</span>
          {activeFilterCount > 0 && (<span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium border border-blue-200/50 dark:border-blue-700/50">
              {activeFilterCount} active
            </span>)}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-gray-500">{resultCount} results</span>
          {activeFilterCount > 0 && (<button id="filter-clear-all" onClick={handleClear} className="text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-700 px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition">
              Clear all
            </button>)}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        <input id="filter-search" type="text" placeholder="Search by no., equipment, subject..." value={searchInput} onChange={function (e) { return setSearchInput(e.target.value); }} className="col-span-2 md:col-span-4 w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition-colors"/>

        <select id="filter-priority" value={filters.priority} onChange={function (e) { return handleChange('priority', e.target.value); }} className="px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition-colors">
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select id="filter-stage" value={filters.stage} onChange={function (e) { return handleChange('stage', e.target.value); }} className="px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition-colors">
          <option value="">All Stages</option>
          <option value="new">New</option>
          <option value="in-progress">In Progress</option>
          <option value="repaired">Repaired</option>
          <option value="scrap">Scrap</option>
        </select>

        <select id="filter-type" value={filters.type} onChange={function (e) { return handleChange('type', e.target.value); }} className="px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition-colors">
          <option value="">All Types</option>
          <option value="corrective">Corrective</option>
          <option value="preventive">Preventive</option>
        </select>

        <select id="filter-technician" value={filters.assignedToId} onChange={function (e) { return handleChange('assignedToId', e.target.value); }} className="px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition-colors">
          <option value="">All Technicians</option>
          {members.map(function (m) { return (<option key={m._id} value={m._id}>{m.name}</option>); })}
        </select>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-start-date" className="text-xs text-gray-400">Start date</label>
          <input id="filter-start-date" type="date" value={filters.startDate} onChange={function (e) { return handleChange('startDate', e.target.value); }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"/>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-end-date" className="text-xs text-gray-400">End date</label>
          <input id="filter-end-date" type="date" value={filters.endDate} onChange={function (e) { return handleChange('endDate', e.target.value); }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"/>
        </div>

      </div>
    </div>);
};
exports.default = FilterBar;
