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
var requestService_1 = require("../services/requestService");
var equipmentService_1 = require("../services/equipmentService");
var teamService_1 = require("../services/teamService");
var inventoryService_1 = require("../services/inventoryService");
var lucide_react_1 = require("lucide-react");
var react_hot_toast_1 = require("react-hot-toast");
var AuthContext_1 = require("../contexts/AuthContext");
var TicketComments_1 = require("./TicketComments");
var RequestToolsTab_1 = require("./RequestToolsTab");
var lucide_react_2 = require("lucide-react");
var ImageUploadZone_1 = require("./ImageUploadZone");
var ImageGallery_1 = require("./ImageGallery");
var axios_1 = require("axios");
var RCAWizardModal_1 = require("./RCAWizardModal");
var react_select_1 = require("react-select");
var certifications_1 = require("../utils/certifications");
var RequestModal = function (_a) {
    var _b, _c, _d, _e, _f, _g, _h;
    var isOpen = _a.isOpen, onClose = _a.onClose, onSuccess = _a.onSuccess, initialDate = _a.initialDate, _j = _a.initialType, initialType = _j === void 0 ? 'corrective' : _j, initialEquipmentId = _a.initialEquipmentId, editRequestId = _a.editRequestId;
    var user = (0, AuthContext_1.useAuth)().user;
    var _k = (0, react_1.useState)('details'), activeTab = _k[0], setActiveTab = _k[1];
    var _l = (0, react_1.useState)(null), existingRequest = _l[0], setExistingRequest = _l[1];
    // Helper function to format date for datetime-local input
    var formatDateForInput = function (dateInput) {
        if (!dateInput)
            return '';
        try {
            var date = void 0;
            // Handle both string and Date object inputs
            if (typeof dateInput === 'string') {
                date = new Date(dateInput);
            }
            else {
                date = dateInput;
            }
            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.warn('Invalid date provided:', dateInput);
                return '';
            }
            // Format as YYYY-MM-DDTHH:mm for datetime-local input
            var year = date.getFullYear();
            var month = String(date.getMonth() + 1).padStart(2, '0');
            var day = String(date.getDate()).padStart(2, '0');
            var hours = String(date.getHours()).padStart(2, '0');
            var minutes = String(date.getMinutes()).padStart(2, '0');
            var formattedDate = "".concat(year, "-").concat(month, "-").concat(day, "T").concat(hours, ":").concat(minutes);
            console.log('Formatted date:', formattedDate);
            return formattedDate;
        }
        catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };
    var _m = (0, react_1.useState)({
        subject: '',
        description: '',
        type: initialType,
        priority: 'medium',
        scheduledDate: formatDateForInput(initialDate),
        equipmentId: '',
        teamId: '',
        assignedToId: '',
        checklist: [],
        requiredSkills: [],
    }), formData = _m[0], setFormData = _m[1];
    var _o = (0, react_1.useState)({
        category: '',
        maintenanceTeam: '',
        maintenanceTeamId: '',
    }), autoFilled = _o[0], setAutoFilled = _o[1];
    var _p = (0, react_1.useState)([]), equipment = _p[0], setEquipment = _p[1];
    var _q = (0, react_1.useState)([]), teams = _q[0], setTeams = _q[1];
    var _r = (0, react_1.useState)([]), members = _r[0], setMembers = _r[1];
    var _s = (0, react_1.useState)([]), spareParts = _s[0], setSpareParts = _s[1];
    var _t = (0, react_1.useState)([]), selectedParts = _t[0], setSelectedParts = _t[1];
    var _u = (0, react_1.useState)([]), requiredParts = _u[0], setRequiredParts = _u[1];
    var _v = (0, react_1.useState)(false), loading = _v[0], setLoading = _v[1];
    var _w = (0, react_1.useState)([]), predictions = _w[0], setPredictions = _w[1];
    var _x = (0, react_1.useState)(false), loadingPredictions = _x[0], setLoadingPredictions = _x[1];
    // Attachments state
    var _y = (0, react_1.useState)([]), attachments = _y[0], setAttachments = _y[1];
    // RCA state
    var _z = (0, react_1.useState)(false), showRCAWizard = _z[0], setShowRCAWizard = _z[1];
    var _0 = (0, react_1.useState)(false), hasRCATree = _0[0], setHasRCATree = _0[1];
    (0, react_1.useEffect)(function () {
        var loadData = function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, equipmentData, teamsData, membersData, partsData, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Promise.all([
                                equipmentService_1.equipmentService.getAll(),
                                teamService_1.teamService.getAllTeams(),
                                teamService_1.teamService.getAllMembers(),
                                inventoryService_1.inventoryService.getAll(),
                            ])];
                    case 1:
                        _a = _b.sent(), equipmentData = _a[0], teamsData = _a[1], membersData = _a[2], partsData = _a[3];
                        setEquipment(equipmentData);
                        setTeams(teamsData);
                        setMembers(membersData);
                        setSpareParts(partsData);
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _b.sent();
                        console.error('Failed to load modal data:', error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        loadData();
    }, []);
    var handleLotoComplete = function (response) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                setExistingRequest(function (prev) { return prev ? __assign(__assign({}, prev), { lotoAudit: response }) : null; });
                react_hot_toast_1.default.success('LOTO Audit completed successfully');
            }
            catch (error) {
                console.error('Failed to save LOTO audit:', error);
                react_hot_toast_1.default.error('Failed to save LOTO audit');
            }
            return [2 /*return*/];
        });
    }); };
    var handleRCAComplete = function (rootCause, rcaNodeId) { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!existingRequest)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    // Patch the maintenance request with the new RCA fields
                    return [4 /*yield*/, requestService_1.requestService.update(existingRequest._id, { rootCause: rootCause, rcaNodeId: rcaNodeId })];
                case 2:
                    // Patch the maintenance request with the new RCA fields
                    _a.sent();
                    setExistingRequest(function (prev) { return prev ? __assign(__assign({}, prev), { rootCause: rootCause, rcaNodeId: rcaNodeId }) : null; });
                    setShowRCAWizard(false);
                    react_hot_toast_1.default.success('RCA saved successfully');
                    onSuccess();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    react_hot_toast_1.default.error('Failed to save RCA Root Cause');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Update scheduled date and pre-selected equipment when modal opens
    (0, react_1.useEffect)(function () {
        if (isOpen) {
            setFormData(function (prev) { return (__assign(__assign({}, prev), { scheduledDate: formatDateForInput(initialDate), equipmentId: initialEquipmentId || prev.equipmentId || '' })); });
            if (initialEquipmentId) {
                handleEquipmentChange(initialEquipmentId);
            }
        }
    }, [isOpen, initialDate, initialEquipmentId]);
    (0, react_1.useEffect)(function () {
        if (isOpen && editRequestId) {
            requestService_1.requestService.getById(editRequestId)
                .then(function (req) {
                setExistingRequest(req);
                // Auto-fill form data for view/edit mode
                setFormData({
                    subject: req.subject || '',
                    description: req.description || '',
                    type: req.type,
                    priority: req.priority,
                    scheduledDate: formatDateForInput(req.scheduledDate),
                    equipmentId: typeof req.equipmentId === 'object' ? req.equipmentId._id : req.equipmentId || '',
                    teamId: typeof req.teamId === 'object' ? req.teamId._id : req.teamId || '',
                    assignedToId: typeof req.assignedToId === 'object' ? req.assignedToId._id : req.assignedToId || '',
                    checklist: req.checklist || [],
                    requiredSkills: req.requiredSkills || [],
                });
            })
                .catch(function (err) {
                console.error('Failed to fetch request details:', err);
                react_hot_toast_1.default.error('Failed to load request details');
            });
            setLoadingPredictions(true);
            requestService_1.requestService.getPredictions(editRequestId)
                .then(function (parts) {
                setPredictions(parts);
                setLoadingPredictions(false);
            })
                .catch(function (err) {
                console.error(err);
                setLoadingPredictions(false);
            });
        }
        else {
            setExistingRequest(null);
        }
    }, [isOpen, editRequestId]);
    (0, react_1.useEffect)(function () {
        var _a;
        if ((_a = existingRequest === null || existingRequest === void 0 ? void 0 : existingRequest.equipment) === null || _a === void 0 ? void 0 : _a.category) {
            axios_1.default.get("/api/v1/diagnostics/".concat(existingRequest.equipment.category, "/has-tree"))
                .then(function (res) { return setHasRCATree(res.data.hasTree); })
                .catch(function () { return setHasRCATree(false); });
        }
        else {
            setHasRCATree(false);
        }
    }, [(_b = existingRequest === null || existingRequest === void 0 ? void 0 : existingRequest.equipment) === null || _b === void 0 ? void 0 : _b.category]);
    var handleReservePart = function (partId) { return __awaiter(void 0, void 0, void 0, function () {
        var error_3;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!editRequestId)
                        return [2 /*return*/];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, requestService_1.requestService.reservePart(editRequestId, partId, 1)];
                case 2:
                    _c.sent();
                    react_hot_toast_1.default.success('Part reserved successfully!');
                    setPredictions(function (prev) { return prev.map(function (p) { return p._id === partId ? __assign(__assign({}, p), { quantityInStock: p.quantityInStock - 1 }) : p; }); });
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _c.sent();
                    react_hot_toast_1.default.error('Failed to reserve part: ' + (((_b = (_a = error_3.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || error_3.message));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Auto-fill category/team
    var handleEquipmentChange = function (equipmentId) { return __awaiter(void 0, void 0, void 0, function () {
        var eq_1, teamObj_1, techObj_1, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setFormData(function (prev) { return (__assign(__assign({}, prev), { equipmentId: equipmentId })); });
                    if (!equipmentId) {
                        setAutoFilled({
                            category: '',
                            maintenanceTeam: '',
                            maintenanceTeamId: '',
                        });
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, equipmentService_1.equipmentService.getById(equipmentId)];
                case 2:
                    eq_1 = _a.sent();
                    teamObj_1 = typeof eq_1.maintenanceTeamId ===
                        'object' &&
                        eq_1.maintenanceTeamId !== null
                        ? eq_1.maintenanceTeamId
                        : null;
                    techObj_1 = typeof eq_1.defaultTechnicianId ===
                        'object' &&
                        eq_1.defaultTechnicianId !== null
                        ? eq_1.defaultTechnicianId
                        : null;
                    setAutoFilled({
                        category: eq_1.category || '',
                        maintenanceTeam: (teamObj_1 === null || teamObj_1 === void 0 ? void 0 : teamObj_1.name) || '',
                        maintenanceTeamId: (teamObj_1 === null || teamObj_1 === void 0 ? void 0 : teamObj_1._id) || '',
                    });
                    setFormData(function (prev) { return (__assign(__assign({}, prev), { teamId: (teamObj_1 === null || teamObj_1 === void 0 ? void 0 : teamObj_1._id) || prev.teamId, assignedToId: (techObj_1 === null || techObj_1 === void 0 ? void 0 : techObj_1._id) ||
                            prev.assignedToId, requiredSkills: eq_1.requiredSkills && eq_1.requiredSkills.length > 0 ? eq_1.requiredSkills : prev.requiredSkills })); });
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    console.error('Failed to fetch equipment:', error_4);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // File selection
    var handleFileChange = function (e) {
        if (!e.target.files)
            return;
        var selectedFiles = Array.from(e.target.files);
        // Max 5 files
        if (selectedFiles.length > 5) {
            alert('Maximum 5 files allowed');
            return;
        }
        // Validate size
        var validFiles = selectedFiles.filter(function (file) {
            if (file.size >
                5 * 1024 * 1024) {
                alert("".concat(file.name, " exceeds 5MB limit"));
                return false;
            }
            return true;
        });
        setAttachments(validFiles);
    };
    var handleSmartAssignInModal = function () { return __awaiter(void 0, void 0, void 0, function () {
        var updated, assignedId_1, err_1, errorMsg;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!editRequestId) {
                        react_hot_toast_1.default.error("Please create the ticket first before using auto-assign.");
                        return [2 /*return*/];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    setLoading(true);
                    return [4 /*yield*/, requestService_1.requestService.smartAssign(editRequestId)];
                case 2:
                    updated = _c.sent();
                    if (updated) {
                        assignedId_1 = typeof updated.assignedToId === 'object' ? updated.assignedToId._id : updated.assignedToId;
                        setFormData(function (prev) { return (__assign(__assign({}, prev), { assignedToId: assignedId_1 || '' })); });
                        onSuccess();
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _c.sent();
                    errorMsg = ((_b = (_a = err_1.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || err_1.message || "Failed to auto-assign";
                    react_hot_toast_1.default.error(errorMsg);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var selectedDate, newRequest, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    // Validate scheduled date if provided
                    if (formData.scheduledDate) {
                        selectedDate = new Date(formData.scheduledDate);
                        if (isNaN(selectedDate.getTime())) {
                            alert('Please enter a valid date and time');
                            return [2 /*return*/];
                        }
                    }
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, 10, 11]);
                    if (!editRequestId) return [3 /*break*/, 5];
                    return [4 /*yield*/, requestService_1.requestService.update(editRequestId, __assign({}, formData))];
                case 2:
                    _a.sent();
                    if (!(attachments.length > 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, requestService_1.requestService.uploadAttachments(editRequestId, attachments)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [3 /*break*/, 8];
                case 5: return [4 /*yield*/, requestService_1.requestService.create(__assign(__assign({}, formData), { partsUsed: selectedParts.filter(function (p) { return p.partId && p.quantityUsed > 0; }), requiredParts: requiredParts.filter(function (p) { return p.partId && p.quantityNeeded > 0; }) }))];
                case 6:
                    newRequest = _a.sent();
                    if (!(attachments.length > 0 && newRequest._id)) return [3 /*break*/, 8];
                    return [4 /*yield*/, requestService_1.requestService.uploadAttachments(newRequest._id, attachments)];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8:
                    onSuccess();
                    return [3 /*break*/, 11];
                case 9:
                    error_5 = _a.sent();
                    console.error('Failed to create/update request:', error_5);
                    alert('Failed to save request');
                    return [3 /*break*/, 11];
                case 10:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    }); };
    var handleDeleteAttachment = function (attachmentId) { return __awaiter(void 0, void 0, void 0, function () {
        var error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!editRequestId)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, requestService_1.requestService.deleteAttachment(editRequestId, attachmentId)];
                case 2:
                    _a.sent();
                    setExistingRequest(function (prev) {
                        var _a;
                        return prev ? __assign(__assign({}, prev), { attachments: (_a = prev.attachments) === null || _a === void 0 ? void 0 : _a.filter(function (a) { return a._id !== attachmentId; }) }) : prev;
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_6 = _a.sent();
                    console.error(error_6);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleTypeChange = function (e) {
        var value = e.target.value;
        setFormData(function (prev) { return (__assign(__assign({}, prev), { type: value })); });
    };
    var handlePriorityChange = function (e) {
        var value = e.target.value;
        setFormData(function (prev) { return (__assign(__assign({}, prev), { priority: value })); });
    };
    var handleClose = function () {
        setAttachments([]);
        setSelectedParts([]);
        setRequiredParts([]);
        setAutoFilled({
            category: '',
            maintenanceTeam: '',
            maintenanceTeamId: '',
        });
        onClose();
    };
    return (<>
    <Modal_1.default isOpen={isOpen} onClose={handleClose} title={editRequestId ? "Request ".concat((existingRequest === null || existingRequest === void 0 ? void 0 : existingRequest.requestNumber) || '') : "Create Maintenance Request"} size="lg">
      {editRequestId && (<div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          <button type="button" className={"py-2 px-4 text-sm font-medium border-b-2 ".concat(activeTab === 'details' ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300')} onClick={function () { return setActiveTab('details'); }}>
            Details
          </button>
          <button type="button" className={"py-2 px-4 text-sm font-medium border-b-2 ".concat(activeTab === 'comments' ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300')} onClick={function () { return setActiveTab('comments'); }}>
            Comments
          </button>
          
          {((_c = existingRequest === null || existingRequest === void 0 ? void 0 : existingRequest.equipment) === null || _c === void 0 ? void 0 : _c.lotoRequired) && (<button type="button" className={"py-2 px-4 text-sm font-medium border-b-2 ".concat(activeTab === 'loto' ? 'border-red-500 text-red-600 dark:text-red-400 dark:border-red-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300', " flex items-center")} onClick={function () { return setActiveTab('loto'); }}>
              <lucide_react_2.ShieldCheck className="h-4 w-4 mr-1.5"/>
              Safety Audit
              {((_d = existingRequest.lotoAudit) === null || _d === void 0 ? void 0 : _d.isCompleted) && (<lucide_react_2.CheckCircle className="h-3 w-3 ml-1.5 text-green-500"/>)}
            </button>)}
          <button type="button" className={"py-2 px-4 text-sm font-medium border-b-2 ".concat(activeTab === 'tools' ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300')} onClick={function () { return setActiveTab('tools'); }}>
            Tools
            {(existingRequest === null || existingRequest === void 0 ? void 0 : existingRequest.checkedOutTools) && existingRequest.checkedOutTools.length > 0 && (<span className="ml-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-full text-xs">
                {existingRequest.checkedOutTools.length}
              </span>)}
          </button>
        </div>)}

      {activeTab === 'details' && (<div className="space-y-6">
        {editRequestId && (predictions.length > 0 || loadingPredictions) && (<div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-900 rounded-xl">
            <h3 className="flex items-center text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">
              <lucide_react_1.Sparkles className="w-4 h-4 mr-1.5 text-blue-500"/>
              AI Recommended Parts
            </h3>
            {loadingPredictions ? (<div className="flex justify-center py-2"><lucide_react_1.Loader2 className="w-5 h-5 animate-spin text-blue-400"/></div>) : (<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {predictions.map(function (part) { return (<div key={part._id} className="p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-blue-100/50 dark:border-blue-800/50 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{part.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Stock: {part.quantityInStock}</p>
                    </div>
                    <button type="button" onClick={function () { return handleReservePart(part._id); }} disabled={part.quantityInStock <= 0} className="mt-2 w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-[10px] font-medium rounded-md transition-colors">
                      {part.quantityInStock <= 0 ? 'Out of Stock' : 'Reserve Part'}
                    </button>
                  </div>); })}
              </div>)}
          </div>)}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject *
          </label>

          <input type="text" required value={formData.subject} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { subject: e.target.value }));
            }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. Leaking oil"/>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>

          <textarea rows={3} value={formData.description} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { description: e.target.value }));
            }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Describe the issue..."/>
        </div>

        {/* Checklist */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Checklist (Sub-tasks)
          </label>
          <div className="space-y-2">
            {(formData.checklist || []).map(function (item, index) { return (<div key={index} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/40 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                <input type="checkbox" checked={item.isCompleted} onChange={function (e) {
                    var newChecklist = __spreadArray([], (formData.checklist || []), true);
                    newChecklist[index].isCompleted = e.target.checked;
                    setFormData(__assign(__assign({}, formData), { checklist: newChecklist }));
                }} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"/>
                <input type="text" value={item.text} onChange={function (e) {
                    var newChecklist = __spreadArray([], (formData.checklist || []), true);
                    newChecklist[index].text = e.target.value;
                    setFormData(__assign(__assign({}, formData), { checklist: newChecklist }));
                }} className={"flex-1 bg-transparent border-none focus:ring-0 text-sm ".concat(item.isCompleted ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white')} placeholder="Task description..."/>
                <button type="button" onClick={function () {
                    var newChecklist = (formData.checklist || []).filter(function (_, i) { return i !== index; });
                    setFormData(__assign(__assign({}, formData), { checklist: newChecklist }));
                }} className="p-1 text-gray-400 hover:text-red-500">
                  <lucide_react_1.Trash2 className="w-4 h-4"/>
                </button>
              </div>); })}
            <button type="button" onClick={function () { return setFormData(__assign(__assign({}, formData), { checklist: __spreadArray(__spreadArray([], (formData.checklist || []), true), [{ text: '', isCompleted: false }], false) })); }} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 mt-2">
              <lucide_react_1.Plus className="w-4 h-4 mr-1"/>
              Add Sub-task
            </button>
          </div>
        </div>

        {/* Type + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>

            <select required value={formData.type} onChange={handleTypeChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="corrective">
                Corrective
              </option>

              <option value="preventive">
                Preventive
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>

            <select value={formData.priority} onChange={handlePriorityChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="low">
                Low
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="high">
                High
              </option>

              <option value="urgent">
                Urgent
              </option>
            </select>
          </div>
        </div>

        {/* Equipment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Equipment
          </label>

          <select value={formData.equipmentId} onChange={function (e) {
                return handleEquipmentChange(e.target.value);
            }} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">Select equipment...</option>
            {equipment.map(function (item) {
                var _a;
                var equipmentId = (_a = item._id) !== null && _a !== void 0 ? _a : item.id;
                return (<option key={equipmentId} value={equipmentId}>
                  {item.name} - {item.serialNumber}
                </option>);
            })}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category (auto-filled)
          </label>

          <input type="text" readOnly value={autoFilled.category} placeholder="Select equipment to auto-fill" className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"/>
        </div>

        {/* Auto Team */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maintenance Team
            (auto-filled)
          </label>

          <input type="text" readOnly value={autoFilled.maintenanceTeam} placeholder="Select equipment to auto-fill" className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"/>
        </div>

        {/* Team */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maintenance Team
          </label>

          <select value={formData.teamId} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { teamId: e.target.value }));
            }} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">Select team...</option>
            {teams.map(function (team) {
                var _a;
                var teamId = (_a = team._id) !== null && _a !== void 0 ? _a : team.id;
                return (<option key={teamId} value={teamId}>
                  {team.name}
                </option>);
            })}
          </select>
        </div>

        {/* Assigned */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assigned To
          </label>

          <select value={formData.assignedToId} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { assignedToId: e.target.value }));
            }} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">Select technician...</option>
            {members.map(function (member) {
                var _a;
                var memberId = (_a = member._id) !== null && _a !== void 0 ? _a : member.id;
                var certificationStatus = "";
                if (formData.requiredSkills && formData.requiredSkills.length > 0) {
                    var techCerts_1 = member.certifications || [];
                    var hasSkills = formData.requiredSkills.every(function (skill) { return techCerts_1.includes(skill); });
                    certificationStatus = hasSkills ? " [✓ Certified]" : " [⚠ Lacks Skills]";
                }
                return (<option key={memberId} value={String(memberId)}>
                  {member.name} {member.role && "(".concat(member.role, ")")}{certificationStatus}
                </option>);
            })}
          </select>

          {/* Required Skills */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
              Required Skills
            </label>
            <react_select_1.default isMulti options={certifications_1.CERTIFICATION_OPTIONS} value={certifications_1.CERTIFICATION_OPTIONS.filter(function (option) { var _a; return (_a = formData.requiredSkills) === null || _a === void 0 ? void 0 : _a.includes(option.value); })} onChange={function (selected) {
                setFormData(__assign(__assign({}, formData), { requiredSkills: selected ? selected.map(function (s) { return s.value; }) : [] }));
            }} className="text-gray-900" placeholder="Select required skills (Auto-filled from equipment)..."/>
          </div>

          {!formData.assignedToId && editRequestId && (<button type="button" onClick={handleSmartAssignInModal} className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 hover:from-violet-500/20 hover:to-indigo-500/20 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 rounded-lg text-xs font-semibold border border-violet-200/50 dark:border-violet-800/30 transition-all duration-200 shadow-sm shadow-violet-500/5">
              <lucide_react_1.Sparkles className="h-3.5 w-3.5 animate-pulse"/>
              Smart Auto-Assign
            </button>)}
        </div>

        {/* Spare Parts Used */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">

        {/* Required Parts (BOM Kit) - Only show when creating */}
        {!editRequestId && (<div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
              Required Parts (Advance Kit Reservation)
            </label>
            <p className="text-xs text-slate-500 mb-3">Parts selected here will be automatically reserved from inventory upon creation.</p>
            <div className="space-y-3">
              {requiredParts.map(function (item, index) { return (<div key={index} className="flex gap-3 items-center bg-teal-50 dark:bg-teal-900/20 p-3 rounded-xl border border-teal-100 dark:border-teal-800/30">
                  <select value={item.partId} onChange={function (e) {
                        var newParts = __spreadArray([], requiredParts, true);
                        newParts[index].partId = e.target.value;
                        setRequiredParts(newParts);
                    }} className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-950 dark:text-white focus:outline-none">
                    <option value="">Select a spare part...</option>
                    {spareParts.map(function (part) { return (<option key={part._id || part.id} value={part._id || part.id}>
                        {part.name} (Stock: {part.quantityInStock})
                      </option>); })}
                  </select>
                  <input type="number" min="1" placeholder="Qty" value={item.quantityNeeded || ""} onChange={function (e) {
                        var newParts = __spreadArray([], requiredParts, true);
                        newParts[index].quantityNeeded = parseInt(e.target.value) || 0;
                        setRequiredParts(newParts);
                    }} className="w-20 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-950 dark:text-white focus:outline-none"/>
                  <button type="button" onClick={function () { return setRequiredParts(requiredParts.filter(function (_, i) { return i !== index; })); }} className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition">
                    <lucide_react_1.Trash2 className="h-4 w-4"/>
                  </button>
                </div>); })}
              <button type="button" onClick={function () { return setRequiredParts(__spreadArray(__spreadArray([], requiredParts, true), [{ partId: "", quantityNeeded: 1 }], false)); }} className="flex items-center text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 gap-1 mt-1">
                <lucide_react_1.Plus className="h-4 w-4"/>
                Add Required Part to Kit
              </button>
            </div>
          </div>)}
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
            Spare Parts Used
          </label>
          <div className="space-y-3">
            {selectedParts.map(function (item, index) { return (<div key={index} className="flex gap-3 items-center bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                {/* Part Dropdown */}
                <select value={item.partId} onChange={function (e) {
                    var newParts = __spreadArray([], selectedParts, true);
                    newParts[index].partId = e.target.value;
                    setSelectedParts(newParts);
                }} className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-950 dark:text-white focus:outline-none">
                  <option value="">Select a spare part...</option>
                  {spareParts.map(function (part) { return (<option key={part._id || part.id} value={part._id || part.id}>
                      {part.name} (Stock: {part.quantityInStock})
                    </option>); })}
                </select>

                {/* Quantity Input */}
                <input type="number" min="1" placeholder="Qty" value={item.quantityUsed || ""} onChange={function (e) {
                    var newParts = __spreadArray([], selectedParts, true);
                    newParts[index].quantityUsed = parseInt(e.target.value) || 0;
                    setSelectedParts(newParts);
                }} className="w-20 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-950 dark:text-white focus:outline-none"/>

                {/* Delete */}
                <button type="button" onClick={function () {
                    setSelectedParts(selectedParts.filter(function (_, i) { return i !== index; }));
                }} className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition">
                  <lucide_react_1.Trash2 className="h-4 w-4"/>
                </button>
              </div>); })}

            <button type="button" onClick={function () { return setSelectedParts(__spreadArray(__spreadArray([], selectedParts, true), [{ partId: "", quantityUsed: 1 }], false)); }} className="flex items-center text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 gap-1 mt-1">
              <lucide_react_1.Plus className="h-4 w-4"/>
              Add Spare Part Used
            </button>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
            Attachments
          </label>

          {(existingRequest === null || existingRequest === void 0 ? void 0 : existingRequest.attachments) && existingRequest.attachments.length > 0 && (<div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
              <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Existing Attachments</h4>
              <ImageGallery_1.default attachments={existingRequest.attachments} onDelete={handleDeleteAttachment}/>
            </div>)}

          <div className="mt-2">
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              Upload New Attachments
            </h4>
            <ImageUploadZone_1.default files={attachments} onChange={setAttachments} maxFiles={5} maxSizeMB={5}/>
          </div>
        </div>

        {/* Scheduled Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scheduled Date
          </label>

          <input type="datetime-local" value={formData.scheduledDate || ''} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { scheduledDate: e.target.value }));
            }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"/>
          {formData.scheduledDate && (<p className="text-xs text-gray-500 mt-1">
              Selected: {new Date(formData.scheduledDate).toLocaleString()}
            </p>)}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button_1.default type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button_1.default>

          <Button_1.default type="submit" disabled={loading}>
            {loading
                ? 'Saving...'
                : (editRequestId ? 'Save Changes' : 'Create Request')}
          </Button_1.default>
        </div>
      </form>
      </div>)}

      {activeTab === 'comments' && existingRequest && (<TicketComments_1.default request={existingRequest} currentUser={user}/>)}

      {activeTab === 'loto' && existingRequest && (<div className="space-y-6">
          {!((_e = existingRequest.lotoAudit) === null || _e === void 0 ? void 0 : _e.isCompleted) ? (<div className="p-6 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/50 rounded-xl text-center">
              <lucide_react_2.ShieldCheck className="h-12 w-12 text-yellow-500 mx-auto mb-3 opacity-50"/>
              <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-400 mb-2">Safety Audit Pending</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                This equipment requires a mandatory Lockout/Tagout (LOTO) procedure. The audit will be prompted when moving the ticket to "In Progress".
              </p>
            </div>) : (<div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-900/50 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-green-50 dark:bg-green-900/20 px-4 py-3 border-b border-green-200 dark:border-green-900/50 flex justify-between items-center">
                <h3 className="font-bold text-green-800 dark:text-green-400 flex items-center">
                  <lucide_react_2.CheckCircle className="h-5 w-5 mr-2"/>
                  LOTO Safety Audit Completed
                </h3>
                <span className="text-xs font-medium text-green-700 dark:text-green-500">
                  {new Date(existingRequest.lotoAudit.completedAt).toLocaleString()}
                </span>
              </div>
              
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Checklist Steps Verified</h4>
                  <ul className="space-y-2">
                    {(_f = existingRequest.lotoAudit.checklistResponses) === null || _f === void 0 ? void 0 : _f.map(function (resp, idx) { return (<li key={idx} className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                        <lucide_react_2.CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5"/>
                        {resp.step}
                      </li>); })}
                    {((_g = existingRequest.lotoAudit) === null || _g === void 0 ? void 0 : _g.isCompleted) && (<div className="flex items-center text-green-600 dark:text-green-400 mt-2">
                        <lucide_react_2.CheckCircle className="h-4 w-4 mr-1.5"/>
                        <span className="text-sm">LOTO Verified</span>
                      </div>)}
                  </ul>
                  
                  {hasRCATree && (<div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Root Cause Analysis</h4>
                      {existingRequest.rootCause ? (<div className="flex items-center text-sm text-blue-800 dark:text-blue-200">
                          <lucide_react_2.CheckCircle className="h-4 w-4 mr-2 text-blue-500"/>
                          <span><strong>Cause:</strong> {existingRequest.rootCause}</span>
                        </div>) : (<button type="button" onClick={function () { return setShowRCAWizard(true); }} className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Run RCA Diagnostic
                        </button>)}
                    </div>)}
                </div>
                
                {existingRequest.lotoAudit.proofImageUrl && (<div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Proof of Lockout</h4>
                    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 aspect-video relative flex items-center justify-center">
                      <img src={existingRequest.lotoAudit.proofImageUrl.startsWith('http') ? existingRequest.lotoAudit.proofImageUrl : "http://localhost:5000".concat(existingRequest.lotoAudit.proofImageUrl)} alt="LOTO Proof" className="max-w-full max-h-full object-contain"/>
                    </div>
                  </div>)}
              </div>
            </div>)}
        </div>)}

      {activeTab === 'tools' && existingRequest && (<RequestToolsTab_1.default requestRecord={existingRequest} onUpdate={function () {
                // refresh data
                requestService_1.requestService.getById(existingRequest._id || existingRequest.id)
                    .then(function (req) {
                    setExistingRequest(req);
                    onSuccess(); // bubble up
                })
                    .catch(console.error);
            }}/>)}
    </Modal_1.default>
      {showRCAWizard && ((_h = existingRequest === null || existingRequest === void 0 ? void 0 : existingRequest.equipment) === null || _h === void 0 ? void 0 : _h.category) && (<RCAWizardModal_1.default category={existingRequest.equipment.category} onClose={function () { return setShowRCAWizard(false); }} onComplete={handleRCAComplete}/>)}
    </>);
};
exports.default = RequestModal;
