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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var api_1 = require("../services/api");
var react_hot_toast_1 = require("react-hot-toast");
var Button_1 = require("./Button");
var lucide_react_1 = require("lucide-react");
var Spinner_1 = require("./Spinner");
var socket_io_client_1 = require("socket.io-client");
var SOCKET_URL = ((_a = import.meta.env.VITE_API_URL) === null || _a === void 0 ? void 0 : _a.replace('/api/v1', '')) || 'http://localhost:5000';
var RequestToolsTab = function (_a) {
    var requestRecord = _a.requestRecord, onUpdate = _a.onUpdate;
    var _b = (0, react_1.useState)([]), availableTools = _b[0], setAvailableTools = _b[1];
    var _c = (0, react_1.useState)(true), loading = _c[0], setLoading = _c[1];
    var _d = (0, react_1.useState)(''), selectedToolId = _d[0], setSelectedToolId = _d[1];
    var _e = (0, react_1.useState)(false), processing = _e[0], setProcessing = _e[1];
    var _f = (0, react_1.useState)(new Set()), lockedTools = _f[0], setLockedTools = _f[1];
    // Use a ref to hold onUpdate so it doesn't trigger effect re-runs
    var onUpdateRef = react_1.default.useRef(onUpdate);
    (0, react_1.useEffect)(function () {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);
    (0, react_1.useEffect)(function () {
        fetchAvailableTools();
        var socket = (0, socket_io_client_1.io)(SOCKET_URL, {
            auth: { token: localStorage.getItem('gearguard_token') }
        });
        socket.on('tools_changed', function () {
            fetchAvailableTools();
            onUpdateRef.current(); // Re-fetch the request record to reflect checkout/returns across clients
        });
        socket.on('tool_locked', function (_a) {
            var toolId = _a.toolId;
            setLockedTools(function (prev) {
                var next = new Set(prev);
                next.add(toolId);
                return next;
            });
        });
        socket.on('tool_unlocked', function (_a) {
            var toolId = _a.toolId;
            setLockedTools(function (prev) {
                var next = new Set(prev);
                next.delete(toolId);
                return next;
            });
        });
        return function () {
            socket.disconnect();
        };
    }, []); // Run only once on mount
    var fetchAvailableTools = function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setLoading(true);
                    return [4 /*yield*/, api_1.default.get('/tools')];
                case 1:
                    res = _a.sent();
                    if (res.data) {
                        // Filter out tools that are not 'Available'
                        setAvailableTools(res.data.filter(function (t) { return t.status === 'Available'; }));
                    }
                    return [3 /*break*/, 4];
                case 2:
                    error_1 = _a.sent();
                    react_hot_toast_1.default.error('Failed to load tools: ' + error_1.message);
                    return [3 /*break*/, 4];
                case 3:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleCheckoutTool = function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, error_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!selectedToolId)
                        return [2 /*return*/];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    setProcessing(true);
                    return [4 /*yield*/, api_1.default.post("/requests/".concat(requestRecord._id || requestRecord.id, "/tools/checkout"), {
                            toolId: selectedToolId
                        })];
                case 2:
                    res = _c.sent();
                    react_hot_toast_1.default.success('Tool checked out successfully');
                    setSelectedToolId('');
                    onUpdate();
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _c.sent();
                    react_hot_toast_1.default.error('Failed to checkout tool: ' + (((_b = (_a = error_2.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || error_2.message));
                    return [3 /*break*/, 5];
                case 4:
                    setProcessing(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleReturnTool = function (toolId) { return __awaiter(void 0, void 0, void 0, function () {
        var res, error_3;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, api_1.default.post("/requests/".concat(requestRecord._id || requestRecord.id, "/tools/return"), {
                            toolId: toolId
                        })];
                case 1:
                    res = _c.sent();
                    react_hot_toast_1.default.success('Tool returned successfully');
                    onUpdate();
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _c.sent();
                    react_hot_toast_1.default.error('Failed to return tool: ' + (((_b = (_a = error_3.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || error_3.message));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var checkedOutTools = requestRecord.checkedOutTools || [];
    if (loading && checkedOutTools.length === 0) {
        return <div className="p-8 flex justify-center"><Spinner_1.default /></div>;
    }
    return (<div className="space-y-6 py-2">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/50">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
            <lucide_react_1.Wrench className="h-5 w-5 mr-2 text-indigo-500"/>
            Tools Checked Out for this Ticket
          </h3>
        </div>
        
        {checkedOutTools.length === 0 ? (<div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No tools currently checked out for this request.
          </div>) : (<div className="divide-y divide-gray-200 dark:divide-gray-700">
            {checkedOutTools.map(function (t, idx) {
                var toolObj = t.toolId;
                var toolName = (toolObj === null || toolObj === void 0 ? void 0 : toolObj.name) || 'Unknown Tool';
                var toolSerial = (toolObj === null || toolObj === void 0 ? void 0 : toolObj.serialNumber) || '';
                var checkoutTime = new Date(t.checkedOutAt).toLocaleString();
                return (<div key={idx} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{toolName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SN: {toolSerial} &bull; Checked out: {checkoutTime}</p>
                  </div>
                  <Button_1.default variant="secondary" onClick={function () { return handleReturnTool(toolObj._id || toolObj); }}>
                    Return Tool
                  </Button_1.default>
                </div>);
            })}
          </div>)}
      </div>

      <div className="p-4 border border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl">
        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">Checkout from Tool Crib</h4>
        <div className="flex gap-3">
          <select value={selectedToolId} onChange={function (e) { return setSelectedToolId(e.target.value); }} className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
            <option value="">Select an available tool...</option>
            {availableTools.map(function (tool) {
            var isLocked = lockedTools.has(tool._id || tool.id || '');
            return (<option key={tool._id} value={tool._id} disabled={isLocked}>
                  {tool.name} ({tool.serialNumber}) {isLocked ? '🔒 (Locking...)' : ''}
                </option>);
        })}
          </select>
          <Button_1.default onClick={handleCheckoutTool} disabled={!selectedToolId || processing || lockedTools.has(selectedToolId)}>
            {processing ? <lucide_react_1.Loader2 className="h-4 w-4 animate-spin"/> : 'Checkout'}
          </Button_1.default>
        </div>
      </div>
    </div>);
};
exports.default = RequestToolsTab;
