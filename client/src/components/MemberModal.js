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
var Modal_1 = require("./Modal");
var Button_1 = require("./Button");
var teamService_1 = require("../services/teamService");
var react_select_1 = require("react-select");
var certifications_1 = require("../utils/certifications");
var MemberModal = function (_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose, onSuccess = _a.onSuccess, defaultTeamId = _a.defaultTeamId;
    var _b = (0, react_1.useState)({
        name: '',
        email: '',
        phone: '',
        role: '',
        teamId: defaultTeamId || '',
        certifications: [],
        isActive: true,
    }), formData = _b[0], setFormData = _b[1];
    var _c = (0, react_1.useState)([]), teams = _c[0], setTeams = _c[1];
    var _d = (0, react_1.useState)(false), loading = _d[0], setLoading = _d[1];
    (0, react_1.useEffect)(function () {
        var loadTeams = function () { return __awaiter(void 0, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, teamService_1.teamService.getAllTeams()];
                    case 1:
                        data = _a.sent();
                        setTeams(data);
                        return [2 /*return*/];
                }
            });
        }); };
        loadTeams();
    }, []);
    (0, react_1.useEffect)(function () {
        if (defaultTeamId) {
            setFormData(function (prev) { return (__assign(__assign({}, prev), { teamId: defaultTeamId })); });
        }
    }, [defaultTeamId]);
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, teamService_1.teamService.createMember(formData)];
                case 2:
                    _a.sent();
                    onSuccess();
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Failed to create team member:', error_1);
                    alert('Failed to create team member');
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (<Modal_1.default isOpen={isOpen} onClose={onClose} title="Add Team Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input type="text" required value={formData.name} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { name: e.target.value })); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"/>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input type="email" required value={formData.email} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { email: e.target.value })); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"/>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input type="tel" value={formData.phone} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { phone: e.target.value })); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"/>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <input type="text" value={formData.role} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { role: e.target.value })); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g., Technician, Senior Technician"/>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Team *
          </label>
          <select required value={formData.teamId} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { teamId: e.target.value })); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Select team...</option>
            {teams.map(function (team) { return (<option key={team.id} value={team.id}>
                {team.name}
              </option>); })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Certifications
          </label>
          <react_select_1.default isMulti options={certifications_1.CERTIFICATION_OPTIONS} value={certifications_1.CERTIFICATION_OPTIONS.filter(function (option) { var _a; return (_a = formData.certifications) === null || _a === void 0 ? void 0 : _a.includes(option.value); })} onChange={function (selected) {
            setFormData(__assign(__assign({}, formData), { certifications: selected ? selected.map(function (s) { return s.value; }) : [] }));
        }} className="text-gray-900" placeholder="Select certifications..."/>
        </div>

        <div className="flex items-center">
          <input type="checkbox" id="isActive" checked={formData.isActive} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { isActive: e.target.checked }));
        }} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"/>
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
            Active
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button_1.default type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button_1.default>
          <Button_1.default type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Add Member'}
          </Button_1.default>
        </div>
      </form>
    </Modal_1.default>);
};
exports.default = MemberModal;
