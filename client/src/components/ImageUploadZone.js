"use strict";
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
var lucide_react_1 = require("lucide-react");
var ImageUploadZone = function (_a) {
    var files = _a.files, onChange = _a.onChange, _b = _a.maxFiles, maxFiles = _b === void 0 ? 5 : _b, _c = _a.maxSizeMB, maxSizeMB = _c === void 0 ? 5 : _c;
    var handleDrop = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(Array.from(e.dataTransfer.files));
        }
    }, [files]);
    var handleDragOver = function (e) {
        e.preventDefault();
    };
    var handleFileInput = function (e) {
        if (e.target.files) {
            processFiles(Array.from(e.target.files));
        }
    };
    var processFiles = function (newFiles) {
        var validFiles = newFiles.filter(function (file) {
            if (file.size > maxSizeMB * 1024 * 1024) {
                alert("File ".concat(file.name, " exceeds ").concat(maxSizeMB, "MB limit."));
                return false;
            }
            return true;
        });
        var totalFiles = __spreadArray(__spreadArray([], files, true), validFiles, true);
        if (totalFiles.length > maxFiles) {
            alert("Maximum ".concat(maxFiles, " files allowed."));
            onChange(totalFiles.slice(0, maxFiles));
        }
        else {
            onChange(totalFiles);
        }
    };
    var removeFile = function (indexToRemove) {
        onChange(files.filter(function (_, index) { return index !== indexToRemove; }));
    };
    return (<div className="w-full">
      <div onDrop={handleDrop} onDragOver={handleDragOver} className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={function () { var _a; return (_a = document.getElementById('file-upload-input')) === null || _a === void 0 ? void 0 : _a.click(); }}>
        <lucide_react_1.UploadCloud className="w-8 h-8 text-gray-400 mb-2"/>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-semibold text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          SVG, PNG, JPG, GIF or PDF (MAX. {maxSizeMB}MB)
        </p>
        <input id="file-upload-input" type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.svg,.gif" className="hidden" onChange={handleFileInput}/>
      </div>

      {files.length > 0 && (<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {files.map(function (file, index) { return (<div key={index} className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 shadow-sm">
              <div className="flex items-center space-x-2 truncate flex-1">
                {file.type.includes('image') ? (<img src={URL.createObjectURL(file)} alt="preview" className="w-8 h-8 object-cover rounded"/>) : (<lucide_react_1.File className="w-6 h-6 text-gray-500 flex-shrink-0"/>)}
                <span className="text-xs truncate text-gray-700 dark:text-gray-200 max-w-[150px]">{file.name}</span>
              </div>
              <button type="button" onClick={function (e) { e.stopPropagation(); removeFile(index); }} className="p-1 flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors">
                <lucide_react_1.X className="w-4 h-4"/>
              </button>
            </div>); })}
        </div>)}
    </div>);
};
exports.default = ImageUploadZone;
