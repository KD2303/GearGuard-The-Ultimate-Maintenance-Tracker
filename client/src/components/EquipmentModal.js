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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var Modal_1 = require("./Modal");
var Button_1 = require("./Button");
var equipmentService_1 = require("../services/equipmentService");
var teamService_1 = require("../services/teamService");
var lucide_react_1 = require("lucide-react");
var react_select_1 = require("react-select");
var certifications_1 = require("../utils/certifications");
var EquipmentModal = function (_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose, onSuccess = _a.onSuccess;
    var _b = (0, react_1.useState)({
        name: "",
        serialNumber: "",
        category: "",
        department: "",
        assignedTo: "",
        location: "",
        purchaseDate: "",
        warrantyExpiry: "",
        manufacturer: "",
        model: "",
        notes: "",
        maintenanceTeamId: "",
        defaultTechnicianId: "",
        licensePlate: "",
        currentMileage: 0,
        fuelType: "",
        purchasePrice: 0,
        expectedLifespanYears: 5,
        salvageValue: 0,
        lotoRequired: false,
        lotoChecklist: [],
        requiredSkills: [],
    }), formData = _b[0], setFormData = _b[1];
    var _c = (0, react_1.useState)([]), teams = _c[0], setTeams = _c[1];
    var _d = (0, react_1.useState)([]), members = _d[0], setMembers = _d[1];
    var _e = (0, react_1.useState)(false), loading = _e[0], setLoading = _e[1];
    var _f = (0, react_1.useState)(false), isSubmitting = _f[0], setIsSubmitting = _f[1];
    var _g = (0, react_1.useState)(""), submitError = _g[0], setSubmitError = _g[1];
    var handleClose = function () {
        setSubmitError("");
        setIsSubmitting(false);
        onClose();
    };
    (0, react_1.useEffect)(function () {
        var loadData = function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, teamsData, membersData;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            teamService_1.teamService.getAllTeams(),
                            teamService_1.teamService.getAllMembers(),
                        ])];
                    case 1:
                        _a = _b.sent(), teamsData = _a[0], membersData = _a[1];
                        setTeams(teamsData);
                        setMembers(membersData);
                        return [2 /*return*/];
                }
            });
        }); };
        loadData();
    }, []);
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var payload, error_1, message;
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    e.preventDefault();
                    setSubmitError("");
                    // Frontend validation before sending to server
                    if (!((_a = formData.name) === null || _a === void 0 ? void 0 : _a.trim())) {
                        setSubmitError("Equipment name is required.");
                        return [2 /*return*/];
                    }
                    if (!((_b = formData.serialNumber) === null || _b === void 0 ? void 0 : _b.trim())) {
                        setSubmitError("Serial number is required.");
                        return [2 /*return*/];
                    }
                    if (!formData.category) {
                        setSubmitError("Category is required.");
                        return [2 /*return*/];
                    }
                    if (!((_c = formData.location) === null || _c === void 0 ? void 0 : _c.trim())) {
                        setSubmitError("Location is required.");
                        return [2 /*return*/];
                    }
                    setIsSubmitting(true);
                    _j.label = 1;
                case 1:
                    _j.trys.push([1, 3, 4, 5]);
                    payload = __assign(__assign({}, formData), { name: formData.name.trim(), serialNumber: formData.serialNumber.trim(), location: formData.location.trim(), department: ((_d = formData.department) === null || _d === void 0 ? void 0 : _d.trim()) || undefined, maintenanceTeamId: formData.maintenanceTeamId || undefined, defaultTechnicianId: formData.defaultTechnicianId || undefined, purchaseDate: formData.purchaseDate || undefined, warrantyExpiry: formData.warrantyExpiry || undefined, notes: ((_e = formData.notes) === null || _e === void 0 ? void 0 : _e.trim()) || undefined, hourlyDowntimeCost: formData.hourlyDowntimeCost || 0, purchasePrice: formData.purchasePrice || 0, expectedLifespanYears: formData.expectedLifespanYears || 5, salvageValue: formData.salvageValue || 0, lotoRequired: formData.lotoRequired, lotoChecklist: ((_f = formData.lotoChecklist) === null || _f === void 0 ? void 0 : _f.filter(function (item) { return item.trim() !== ""; })) || [] });
                    return [4 /*yield*/, equipmentService_1.equipmentService.create(payload)];
                case 2:
                    _j.sent();
                    setSubmitError("");
                    onSuccess();
                    handleClose();
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _j.sent();
                    message = ((_h = (_g = error_1 === null || error_1 === void 0 ? void 0 : error_1.response) === null || _g === void 0 ? void 0 : _g.data) === null || _h === void 0 ? void 0 : _h.error) ||
                        (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) ||
                        "Failed to create equipment. Please check all fields and try again.";
                    setSubmitError(message);
                    return [3 /*break*/, 5];
                case 4:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (<Modal_1.default isOpen={isOpen} onClose={handleClose} title="Add Equipment" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Equipment Name *
            </label>
            <input type="text" required value={formData.name} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { name: e.target.value }));
        }} className="input-dark"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Serial Number *
            </label>
            <input type="text" required value={formData.serialNumber} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { serialNumber: e.target.value }));
        }} className="input-dark"/>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Category *
            </label>
            <select required value={formData.category} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { category: e.target.value }));
        }} className="input-dark">
              <option value="">Select category...</option>
              <option value="Machine">Machine</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Computer">Computer</option>
              <option value="Office">Office</option>
              <option value="Tools">Tools</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Location *
            </label>
            <input type="text" required value={formData.location} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { location: e.target.value }));
        }} className="input-dark"/>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Department
            </label>
            <input type="text" value={formData.department} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { department: e.target.value }));
        }} className="input-dark" placeholder="e.g., Production, IT"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Assigned To
            </label>
            <input type="text" value={formData.assignedTo} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { assignedTo: e.target.value }));
        }} className="input-dark" placeholder="Employee name"/>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Manufacturer
            </label>
            <input type="text" value={formData.manufacturer} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { manufacturer: e.target.value }));
        }} className="input-dark"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Model
            </label>
            <input type="text" value={formData.model} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { model: e.target.value }));
        }} className="input-dark"/>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Purchase Date
            </label>
            <input type="date" value={formData.purchaseDate} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { purchaseDate: e.target.value }));
        }} className="input-dark"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Warranty Expiry
            </label>
            <input type="date" value={formData.warrantyExpiry} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { warrantyExpiry: e.target.value }));
        }} className="input-dark"/>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Purchase Price ($)
            </label>
            <input type="number" min="0" step="0.01" value={formData.purchasePrice || ""} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { purchasePrice: Number(e.target.value) }));
        }} className="input-dark"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Expected Lifespan (Years)
            </label>
            <input type="number" min="0" step="1" value={formData.expectedLifespanYears || ""} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { expectedLifespanYears: Number(e.target.value) }));
        }} className="input-dark"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Salvage Value ($)
            </label>
            <input type="number" min="0" step="0.01" value={formData.salvageValue || ""} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { salvageValue: Number(e.target.value) }));
        }} className="input-dark"/>
          </div>
        </div>

        {formData.category.toLowerCase() === "vehicle" && (<div className="bg-orange-50 dark:bg-gray-800 p-4 rounded-xl border border-orange-100 dark:border-gray-700 transition-colors">
            <h4 className="text-sm font-bold text-orange-800 flex items-center">
              <lucide_react_1.Car className="h-4 w-4 mr-2"/>
              Vehicle Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
                  License Plate
                </label>
                <input type="text" value={formData.licensePlate} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { licensePlate: e.target.value }));
            }} placeholder="e.g., ABC-1234" className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500  bg-white dark:bg-gray-800 text-gray-900 dark:text-white"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
                  Current Mileage (km)
                </label>
                <input type="number" value={formData.currentMileage} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { currentMileage: Number(e.target.value) }));
            }} className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
                Fuel Type
              </label>
              <select value={formData.fuelType} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { fuelType: e.target.value }));
            }} className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="">Select fuel type...</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="CNG">CNG</option>
              </select>
            </div>
          </div>)}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Maintenance Team
          </label>
          <select value={formData.maintenanceTeamId} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { maintenanceTeamId: e.target.value }));
        }} className="input-dark">
            <option value="">Select team...</option>
            {teams.map(function (team) { return (<option key={team.id} value={team.id}>
                {team.name}
              </option>); })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Default Technician
          </label>
          <select value={formData.defaultTechnicianId} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { defaultTechnicianId: e.target.value }));
        }} className="input-dark">
            <option value="">Select technician...</option>
            {members
            .filter(function (m) {
            return !formData.maintenanceTeamId ||
                m.teamId === formData.maintenanceTeamId;
        })
            .map(function (member) { return (<option key={member.id} value={member.id}>
                  {member.name}
                </option>); })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Required Skills
          </label>
          <react_select_1.default isMulti options={certifications_1.CERTIFICATION_OPTIONS} value={certifications_1.CERTIFICATION_OPTIONS.filter(function (option) { var _a; return (_a = formData.requiredSkills) === null || _a === void 0 ? void 0 : _a.includes(option.value); })} onChange={function (selected) {
            setFormData(__assign(__assign({}, formData), { requiredSkills: selected ? selected.map(function (s) { return s.value; }) : [] }));
        }} className="text-gray-900" placeholder="Select required skills..."/>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Hourly Downtime Cost ($)
          </label>
          <input type="number" min="0" step="0.01" value={formData.hourlyDowntimeCost || ""} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { hourlyDowntimeCost: Number(e.target.value) }));
        }} className="input-dark" placeholder="e.g. 150"/>
        </div>

        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
          <div className="flex items-center mb-3">
            <input type="checkbox" id="lotoRequired" checked={formData.lotoRequired} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { lotoRequired: e.target.checked })); }} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"/>
            <label htmlFor="lotoRequired" className="ml-2 block text-sm font-bold text-red-800 dark:text-red-400">
              Lockout/Tagout (LOTO) Safety Audit Required
            </label>
          </div>
          
          {formData.lotoRequired && (<div className="mt-3 pl-6 space-y-2">
              <label className="block text-xs font-semibold text-red-700 dark:text-red-300">
                Safety Checklist Steps
              </label>
              {(formData.lotoChecklist || []).map(function (step, idx) { return (<div key={idx} className="flex gap-2">
                  <input type="text" value={step} onChange={function (e) {
                    var newChecklist = __spreadArray([], (formData.lotoChecklist || []), true);
                    newChecklist[idx] = e.target.value;
                    setFormData(__assign(__assign({}, formData), { lotoChecklist: newChecklist }));
                }} placeholder={"e.g. \"Main power disconnected\""} className="flex-1 px-3 py-1.5 border border-red-200 dark:border-red-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-800 text-sm"/>
                  <button type="button" onClick={function () {
                    var newChecklist = (formData.lotoChecklist || []).filter(function (_, i) { return i !== idx; });
                    setFormData(__assign(__assign({}, formData), { lotoChecklist: newChecklist }));
                }} className="text-red-500 hover:text-red-700 text-sm font-medium px-2">
                    Remove
                  </button>
                </div>); })}
              <button type="button" onClick={function () { return setFormData(__assign(__assign({}, formData), { lotoChecklist: __spreadArray(__spreadArray([], (formData.lotoChecklist || []), true), [""], false) })); }} className="text-xs font-bold text-red-600 hover:text-red-700 mt-2">
                + Add Checklist Step
              </button>
            </div>)}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Notes
          </label>
          <textarea value={formData.notes} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { notes: e.target.value }));
        }} rows={3} className="input-dark"/>
        </div>

        {submitError && (<div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 font-medium">{submitError}</p>
          </div>)}
        <div className="flex justify-end gap-3 pt-4">
          <Button_1.default type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button_1.default>
          <Button_1.default type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Equipment"}
          </Button_1.default>
        </div>
      </form>
    </Modal_1.default>);
};
exports.default = EquipmentModal;
