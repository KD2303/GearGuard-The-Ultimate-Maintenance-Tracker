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
var Modal_1 = require("./Modal");
var Button_1 = require("./Button");
var equipmentService_1 = require("../services/equipmentService");
var dateUtils_1 = require("../utils/dateUtils");
var Badge_1 = require("./Badge");
var lucide_react_1 = require("lucide-react");
var Spinner_1 = require("./Spinner");
var RequestModal_1 = require("./RequestModal");
var ExportButton_1 = require("./ExportButton");
var exportService_1 = require("../services/exportService");
var EquipmentHistoryTimeline_1 = require("./EquipmentHistoryTimeline");
var HealthRing_1 = require("./HealthRing");
var qrcode_react_1 = require("qrcode.react");
var lucide_react_2 = require("lucide-react");
var TelemetryChart_1 = require("./telemetry/TelemetryChart");
var AlertRulesConfig_1 = require("./telemetry/AlertRulesConfig");
var EquipmentDocumentsTab_1 = require("./EquipmentDocumentsTab");
var lucide_react_3 = require("lucide-react");
var EquipmentDetailModal = function (_a) {
    var _b;
    var equipment = _a.equipment, isOpen = _a.isOpen, onClose = _a.onClose, onUpdate = _a.onUpdate;
    var _c = (0, react_1.useState)([]), maintenanceHistory = _c[0], setMaintenanceHistory = _c[1];
    var _d = (0, react_1.useState)(true), loading = _d[0], setLoading = _d[1];
    var _e = (0, react_1.useState)(false), isRequestModalOpen = _e[0], setIsRequestModalOpen = _e[1];
    var loadHistory = function () { return __awaiter(void 0, void 0, void 0, function () {
        var history_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setLoading(true);
                    return [4 /*yield*/, equipmentService_1.equipmentService.getMaintenanceHistory(equipment.id)];
                case 1:
                    history_1 = _a.sent();
                    setMaintenanceHistory(history_1);
                    return [3 /*break*/, 4];
                case 2:
                    error_1 = _a.sent();
                    console.error('Failed to load maintenance history:', error_1);
                    return [3 /*break*/, 4];
                case 3:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var downloadQRCode = function () {
        var canvas = document.getElementById("qr-gen");
        if (canvas) {
            var pngUrl = canvas
                .toDataURL("image/png")
                .replace("image/png", "image/octet-stream");
            var downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = "".concat(equipment.name.replace(/\s+/g, '_'), "-QR-Badge.png");
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };
    (0, react_1.useEffect)(function () {
        if (equipment.id && isOpen) {
            loadHistory();
        }
    }, [equipment.id, isOpen]);
    var statusColors = {
        active: 'success',
        inactive: 'default',
        scrapped: 'danger',
        'under-maintenance': 'warning',
    };
    var openRequests = maintenanceHistory.filter(function (req) { return req.stage !== 'repaired' && req.stage !== 'scrap'; });
    var _f = (0, react_1.useState)('overview'), activeTab = _f[0], setActiveTab = _f[1];
    return (<Modal_1.default isOpen={isOpen} onClose={onClose} title={equipment.name} size="xl">
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 space-x-4 px-2">
        <button onClick={function () { return setActiveTab('overview'); }} className={"pb-2 px-2 text-sm font-medium flex items-center transition-colors ".concat(activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200')}>
          <lucide_react_1.Wrench className="h-4 w-4 mr-2"/>
          Overview & History
        </button>
        <button onClick={function () { return setActiveTab('documents'); }} className={"pb-2 px-2 text-sm font-medium flex items-center transition-colors ".concat(activeTab === 'documents' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200')}>
          <lucide_react_3.FileText className="h-4 w-4 mr-2"/>
          Documents & Manuals
          {equipment.documents && equipment.documents.length > 0 && (<span className="ml-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-full text-xs">
              {equipment.documents.length}
            </span>)}
        </button>
      </div>

      <div className={activeTab === 'overview' ? 'space-y-6' : 'hidden'}>
        {/* Equipment Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <HealthRing_1.default score={(_b = equipment.healthScore) !== null && _b !== void 0 ? _b : 100} size={80} strokeWidth={6} breakdown={equipment.healthScoreBreakdown}/>
            <div className="mt-3 flex flex-col items-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 tracking-wider uppercase">System Status</p>
              <Badge_1.default variant={statusColors[equipment.status]}>{equipment.status}</Badge_1.default>
            </div>
          </div>
          <div className="flex flex-col justify-center space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Serial Number</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.serialNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.category}</p>
            </div>
          </div>
          <div className="flex items-center">
            <lucide_react_1.MapPin className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400"/>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.location}</p>
            </div>
          </div>
          {equipment.department && (<div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.department}</p>
            </div>)}
          {equipment.assignedTo && (<div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Assigned To</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.assignedTo}</p>
            </div>)}
          {equipment.manufacturer && (<div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manufacturer</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.manufacturer}</p>
            </div>)}
          {equipment.model && (<div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Model</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.model}</p>
            </div>)}
          {equipment.purchaseDate && (<div className="flex items-center">
              <lucide_react_1.Calendar className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400"/>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Purchase Date</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(equipment.purchaseDate).toLocaleDateString()}
                </p>
              </div>
            </div>)}
          {equipment.warrantyExpiry && (<div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Warranty Expiry</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(equipment.warrantyExpiry).toLocaleDateString()}
              </p>
            </div>)}
          {equipment.licensePlate && (<div>
              <p className="text-sm text-gray-600 dark:text-gray-400">License Plate</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.licensePlate}</p>
            </div>)}
          {equipment.currentMileage !== undefined && (<div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Mileage</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.currentMileage.toLocaleString()} km</p>
            </div>)}
          {equipment.fuelType && (<div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fuel Type</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.fuelType}</p>
            </div>)}
        </div>

        {equipment.maintenanceTeam && (<div className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg transition-colors">
            <p className="text-sm text-gray-600 dark:text-gray-400">Maintenance Team</p>
            <p className="font-medium text-gray-900 dark:text-white">{equipment.maintenanceTeam.name}</p>
            {equipment.defaultTechnician && (<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Default Technician: {equipment.defaultTechnician.name}
              </p>)}
          </div>)}

        {equipment.notes && (<div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Notes</p>
            <p className="text-gray-700 dark:text-gray-200">{equipment.notes}</p>
          </div>)}

        {/* Maintenance History - Smart Button */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <lucide_react_1.Wrench className="h-5 w-5 mr-2"/>
              Maintenance History
            </h4>
            {openRequests.length > 0 && (<Badge_1.default variant="warning">
                {openRequests.length} Open Request{openRequests.length !== 1 ? 's' : ''}
              </Badge_1.default>)}
          </div>

          {loading ? (<div className="py-8 text-gray-600 dark:text-gray-400">
              <Spinner_1.default size="md" label="Loading history..."/>
            </div>) : maintenanceHistory.length > 0 ? (<div className="space-y-3 max-h-64 overflow-y-auto">
              {maintenanceHistory.map(function (request) { return (<div key={request.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{request.subject}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{request.requestNumber}</p>
                    </div>
                    <Badge_1.default variant={request.stage === 'new'
                    ? 'info'
                    : request.stage === 'in-progress'
                        ? 'warning'
                        : request.stage === 'repaired'
                            ? 'success'
                            : 'danger'} size="sm">
                      {request.stage}
                    </Badge_1.default>
                  </div>
                  {request.assignedTo && (<p className="text-sm text-gray-600 dark:text-gray-400">
                      Assigned to: {request.assignedTo.name}
                    </p>)}
                  {request.scheduledDate && (<p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <span>Scheduled: {new Date(request.scheduledDate).toLocaleDateString()}</span>
                      {request.stage !== "repaired" && request.stage !== "scrap" && (<span className={"ml-2 font-medium ".concat((0, dateUtils_1.getRelativeDateLabel)(request.scheduledDate).colorClass)}>
                          {(0, dateUtils_1.getRelativeDateLabel)(request.scheduledDate).label}
                        </span>)}
                    </p>)}
                </div>); })}
            </div>) : (<div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <lucide_react_1.AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400"/>
              <p>No maintenance history yet</p>
            </div>)}
        </div>

        {/* Telemetry Charts & Rules */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              Real-time Telemetry
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TelemetryChart_1.default equipmentId={equipment.id || equipment._id || ''} metricType="temperature"/>
            <TelemetryChart_1.default equipmentId={equipment.id || equipment._id || ''} metricType="vibration"/>
          </div>
          <AlertRulesConfig_1.default equipmentId={equipment.id || equipment._id || ''}/>
        </div>

        {/* Equipment Audit History */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              Equipment History
            </h4>
          </div>
          <div className="bg-slate-900 rounded-lg p-6 max-h-[400px] overflow-y-auto">
            <EquipmentHistoryTimeline_1.default history={equipment.history || []}/>
          </div>
        </div>
      </div>

      <div className={activeTab === 'documents' ? 'py-2' : 'hidden'}>
        <EquipmentDocumentsTab_1.default equipment={equipment} onUpdate={onUpdate || (function () { })}/>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
          <div style={{ display: 'none' }}>
            <qrcode_react_1.QRCodeCanvas id="qr-gen" value={"".concat(window.location.origin, "/requests?action=newRequest&equipmentId=").concat(equipment.id || equipment._id)} size={512} level={"H"} includeMargin={true}/>
          </div>
          <Button_1.default variant="secondary" onClick={downloadQRCode}>
            <lucide_react_2.QrCode className="h-4 w-4 mr-2"/>
            Download QR Badge
          </Button_1.default>
          <ExportButton_1.default label="Download PDF Report" onClick={function () { return (0, exportService_1.exportEquipmentPDF)(equipment.id || equipment._id || '', equipment.name); }} variant="pdf"/>
          <Button_1.default variant="primary" onClick={function () { return setIsRequestModalOpen(true); }}>
            <lucide_react_1.Wrench className="h-4 w-4 mr-2"/>
            Request Maintenance
            {openRequests.length > 0 && (<span className="ml-2 px-2 py-0.5 text-xs font-bold bg-white text-blue-600 rounded-full">
                {openRequests.length}
              </span>)}
          </Button_1.default>
          <Button_1.default variant="secondary" onClick={onClose}>Close</Button_1.default>
        </div>
      {isRequestModalOpen && (<RequestModal_1.default isOpen={isRequestModalOpen} onClose={function () { return setIsRequestModalOpen(false); }} onSuccess={function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            setIsRequestModalOpen(false);
                            return [4 /*yield*/, loadHistory()];
                        case 1:
                            _a.sent();
                            if (!onUpdate) return [3 /*break*/, 3];
                            return [4 /*yield*/, onUpdate()];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            }); }} initialEquipmentId={equipment.id}/>)}
    </Modal_1.default>);
};
exports.default = EquipmentDetailModal;
