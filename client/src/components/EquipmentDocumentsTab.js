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
var equipmentService_1 = require("../services/equipmentService");
var lucide_react_1 = require("lucide-react");
var Badge_1 = require("./Badge");
var react_hot_toast_1 = require("react-hot-toast");
var axios_1 = require("axios");
var EquipmentDocumentsTab = function (_a) {
    var _b;
    var equipment = _a.equipment, onUpdate = _a.onUpdate;
    var _c = (0, react_1.useState)(false), isUploading = _c[0], setIsUploading = _c[1];
    var _d = (0, react_1.useState)(''), uploadTitle = _d[0], setUploadTitle = _d[1];
    var _e = (0, react_1.useState)('Manual'), docCategory = _e[0], setDocCategory = _e[1];
    var fileInputRef = (0, react_1.useRef)(null);
    var handleFileUpload = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var file, formData, uploadRes, uploadedFile, newDocument, updatedDocuments, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
                    if (!file)
                        return [2 /*return*/];
                    if (!uploadTitle.trim()) {
                        react_hot_toast_1.default.error("Please provide a title for the document first.");
                        if (fileInputRef.current)
                            fileInputRef.current.value = '';
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, 6, 7]);
                    setIsUploading(true);
                    formData = new FormData();
                    formData.append('attachments', file);
                    return [4 /*yield*/, axios_1.default.post('/api/upload/attachments', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        })];
                case 2:
                    uploadRes = _b.sent();
                    uploadedFile = uploadRes.data[0];
                    newDocument = {
                        title: uploadTitle,
                        fileUrl: uploadedFile.fileUrl,
                        fileType: uploadedFile.fileType,
                        docCategory: docCategory
                    };
                    updatedDocuments = __spreadArray(__spreadArray([], (equipment.documents || []), true), [newDocument], false);
                    return [4 /*yield*/, equipmentService_1.equipmentService.update(equipment.id || equipment._id, {
                            documents: updatedDocuments
                        })];
                case 3:
                    _b.sent();
                    react_hot_toast_1.default.success('Document uploaded successfully!');
                    setUploadTitle('');
                    if (fileInputRef.current)
                        fileInputRef.current.value = '';
                    return [4 /*yield*/, onUpdate()];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 5:
                    error_1 = _b.sent();
                    console.error('Failed to upload document:', error_1);
                    react_hot_toast_1.default.error('Failed to upload document.');
                    return [3 /*break*/, 7];
                case 6:
                    setIsUploading(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var handleDelete = function (docUrl) { return __awaiter(void 0, void 0, void 0, function () {
        var updatedDocuments, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm('Are you sure you want to delete this document?'))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    updatedDocuments = (equipment.documents || []).filter(function (doc) { return doc.fileUrl !== docUrl; });
                    return [4 /*yield*/, equipmentService_1.equipmentService.update(equipment.id || equipment._id, {
                            documents: updatedDocuments
                        })];
                case 2:
                    _a.sent();
                    react_hot_toast_1.default.success('Document deleted!');
                    return [4 /*yield*/, onUpdate()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    console.error('Failed to delete document:', error_2);
                    react_hot_toast_1.default.error('Failed to delete document.');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var categoryColors = {
        Manual: 'info',
        Schematic: 'warning',
        Safety: 'danger',
        Warranty: 'success',
        Other: 'default'
    };
    return (<div className="space-y-6">
      {/* Upload Section (Manager/Admin typically) */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <h4 className="text-sm font-semibold mb-3 flex items-center dark:text-white">
          <lucide_react_1.Upload className="h-4 w-4 mr-2 text-blue-500"/>
          Upload New Document
        </h4>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs text-gray-500 mb-1">Document Title</label>
            <input type="text" value={uploadTitle} onChange={function (e) { return setUploadTitle(e.target.value); }} placeholder="e.g. User Manual v2" className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-xs text-gray-500 mb-1">Category</label>
            <select value={docCategory} onChange={function (e) { return setDocCategory(e.target.value); }} className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="Manual">Manual</option>
              <option value="Schematic">Schematic</option>
              <option value="Safety">Safety Datasheet</option>
              <option value="Warranty">Warranty</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="application/pdf,image/jpeg,image/png" className="hidden" id="file-upload" disabled={isUploading}/>
            <label htmlFor="file-upload">
              <div className={"px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium cursor-pointer flex items-center justify-center min-w-[120px] transition-colors ".concat(isUploading ? 'opacity-70 pointer-events-none' : '')}>
                {isUploading ? 'Uploading...' : 'Browse File'}
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div>
        <h4 className="text-md font-semibold mb-3 flex items-center dark:text-white border-b pb-2 dark:border-gray-700">
          <lucide_react_1.FileText className="h-5 w-5 mr-2 text-gray-500"/>
          Attached Documents ({((_b = equipment.documents) === null || _b === void 0 ? void 0 : _b.length) || 0})
        </h4>
        
        {(!equipment.documents || equipment.documents.length === 0) ? (<div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
            <lucide_react_1.FileText className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600"/>
            <p>No documents found for this equipment.</p>
          </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {equipment.documents.map(function (doc, idx) {
                var _a;
                return (<div key={idx} className="flex flex-col bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-gray-900 dark:text-white flex-1 pr-2 truncate" title={doc.title}>
                    {doc.title}
                  </h5>
                  <Badge_1.default variant={categoryColors[doc.docCategory] || 'default'} size="sm">
                    {doc.docCategory}
                  </Badge_1.default>
                </div>
                
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span>{new Date(doc.uploadedAt || new Date()).toLocaleDateString()}</span>
                  <span className="mx-2">•</span>
                  <span className="truncate max-w-[120px]">{((_a = doc.fileType) === null || _a === void 0 ? void 0 : _a.includes('pdf')) ? 'PDF Document' : 'Image'}</span>
                </div>
                
                <div className="mt-auto flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700/50">
                  <a href={doc.fileUrl.startsWith('http') ? doc.fileUrl : "http://localhost:5000".concat(doc.fileUrl)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center">
                    <lucide_react_1.ExternalLink className="h-4 w-4 mr-1"/>
                    View File
                  </a>
                  <button onClick={function () { return handleDelete(doc.fileUrl); }} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Delete Document">
                    <lucide_react_1.Trash2 className="h-4 w-4"/>
                  </button>
                </div>
              </div>);
            })}
          </div>)}
      </div>
    </div>);
};
exports.default = EquipmentDocumentsTab;
