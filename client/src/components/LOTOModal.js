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
var lucide_react_1 = require("lucide-react");
var react_hot_toast_1 = require("react-hot-toast");
var api_1 = require("../services/api");
var requestService_1 = require("../services/requestService");
var LOTOModal = function (_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose, onSuccess = _a.onSuccess, requestRecord = _a.requestRecord;
    var equipment = requestRecord.equipment;
    var lotoChecklist = (equipment === null || equipment === void 0 ? void 0 : equipment.lotoChecklist) || [];
    var _b = (0, react_1.useState)([]), checklistResponses = _b[0], setChecklistResponses = _b[1];
    var _c = (0, react_1.useState)(null), file = _c[0], setFile = _c[1];
    var _d = (0, react_1.useState)(false), isSubmitting = _d[0], setIsSubmitting = _d[1];
    (0, react_1.useEffect)(function () {
        if (isOpen && lotoChecklist.length > 0) {
            setChecklistResponses(lotoChecklist.map(function (step) { return ({ step: step, checked: false }); }));
        }
    }, [isOpen, lotoChecklist]);
    var allChecked = checklistResponses.length > 0 && checklistResponses.every(function (r) { return r.checked; });
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var attachments, proofImageUrl, res, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    e.preventDefault();
                    if (!allChecked) {
                        react_hot_toast_1.default.error('You must verify all safety steps before proceeding.');
                        return [2 /*return*/];
                    }
                    if (!file) {
                        react_hot_toast_1.default.error('You must upload a photo of the physical padlock to prove LOTO compliance.');
                        return [2 /*return*/];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, 5, 6]);
                    setIsSubmitting(true);
                    return [4 /*yield*/, requestService_1.requestService.uploadAttachments(requestRecord.id || requestRecord._id || "", [file])];
                case 2:
                    attachments = _c.sent();
                    proofImageUrl = attachments[0].fileUrl;
                    return [4 /*yield*/, api_1.default.post("/requests/".concat(requestRecord.id || requestRecord._id, "/loto"), {
                            checklistResponses: checklistResponses,
                            proofImageUrl: proofImageUrl
                        })];
                case 3:
                    res = _c.sent();
                    react_hot_toast_1.default.success('Safety Audit completed successfully.');
                    onSuccess();
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _c.sent();
                    react_hot_toast_1.default.error('Failed to submit Safety Audit: ' + (((_b = (_a = error_1.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || error_1.message));
                    return [3 /*break*/, 6];
                case 5:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleFileChange = function (e) {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };
    return (<Modal_1.default isOpen={isOpen} onClose={onClose} title="Safety Audit: Lockout/Tagout (LOTO)" size="md">
      <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-900/50 mb-6">
        <div className="flex items-start">
          <lucide_react_1.ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-500 mt-0.5 mr-3 flex-shrink-0"/>
          <div>
            <h4 className="text-sm font-bold text-red-900 dark:text-red-400">CRITICAL SAFETY STOP</h4>
            <p className="text-sm text-red-800 dark:text-red-300 mt-1">
              The equipment <strong>{equipment === null || equipment === void 0 ? void 0 : equipment.name}</strong> requires mandatory Lockout/Tagout procedures before maintenance can begin. Falsifying this audit is grounds for immediate termination.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <lucide_react_1.CheckCircle2 className="h-5 w-5 mr-2 text-indigo-500"/>
            1. Verify Safety Steps
          </h5>
          <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            {checklistResponses.map(function (item, idx) { return (<label key={idx} className="flex items-start cursor-pointer group">
                <div className="flex items-center h-5 mt-0.5">
                  <input type="checkbox" required checked={item.checked} onChange={function (e) {
                var newRes = __spreadArray([], checklistResponses, true);
                newRes[idx].checked = e.target.checked;
                setChecklistResponses(newRes);
            }} className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"/>
                </div>
                <span className={"ml-3 text-sm transition-colors ".concat(item.checked ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400')}>
                  {item.step}
                </span>
              </label>); })}
            {checklistResponses.length === 0 && (<p className="text-sm text-gray-500 italic flex items-center">
                <lucide_react_1.Info className="h-4 w-4 mr-1"/> No specific steps defined for this equipment. Check the box to proceed.
              </p>)}
          </div>
        </div>

        <div>
          <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <lucide_react_1.Upload className="h-5 w-5 mr-2 text-indigo-500"/>
            2. Upload Proof
          </h5>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Upload a clear photo of the physical padlock securing the power switch.
            </p>
            <input type="file" accept="image/*" required onChange={handleFileChange} className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                dark:file:bg-indigo-900/30 dark:file:text-indigo-400
                hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"/>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button_1.default type="button" variant="secondary" onClick={onClose}>
            Cancel Move
          </Button_1.default>
          <Button_1.default type="submit" disabled={!allChecked || !file || isSubmitting} className={!allChecked || !file ? 'opacity-50 cursor-not-allowed' : ''}>
            {isSubmitting ? (<><lucide_react_1.Loader2 className="h-4 w-4 mr-2 animate-spin"/> Verifying...</>) : ('Submit Audit & Start Work')}
          </Button_1.default>
        </div>
      </form>
    </Modal_1.default>);
};
exports.default = LOTOModal;
