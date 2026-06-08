"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var ImageGallery = function (_a) {
    var attachments = _a.attachments, onDelete = _a.onDelete;
    var _b = (0, react_1.useState)(null), selectedImage = _b[0], setSelectedImage = _b[1];
    if (!attachments || attachments.length === 0) {
        return <p className="text-sm text-gray-500 italic">No attachments provided.</p>;
    }
    var getFullUrl = function (url) {
        if (url.startsWith('http'))
            return url;
        return "http://localhost:5000".concat(url);
    };
    return (<div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {attachments.map(function (attachment, index) {
            var _a, _b;
            var isImage = ((_a = attachment.fileType) === null || _a === void 0 ? void 0 : _a.includes('image')) || ((_b = attachment.filename) === null || _b === void 0 ? void 0 : _b.match(/\.(jpg|jpeg|png|gif)$/i));
            return (<div key={index} className="group relative flex flex-col items-center p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:shadow-md transition-shadow" onClick={function () { return isImage ? setSelectedImage(attachment) : window.open(getFullUrl(attachment.fileUrl), '_blank'); }}>
              {isImage ? (<img src={getFullUrl(attachment.fileUrl)} alt={attachment.filename} className="w-full h-24 object-cover rounded-md mb-2 group-hover:opacity-90 transition-opacity"/>) : (<div className="w-full h-24 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-md mb-2">
                  <lucide_react_1.FileText className="w-8 h-8 text-gray-500 dark:text-gray-400"/>
                </div>)}
              <span className="text-xs truncate w-full text-center text-gray-700 dark:text-gray-300 font-medium px-1 mt-1">
                {attachment.filename}
              </span>
              
              {/* Overlay Actions */}
              <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isImage && (<button onClick={function (e) { e.stopPropagation(); window.open(getFullUrl(attachment.fileUrl), '_blank'); }} className="p-1.5 bg-white dark:bg-gray-900 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                     <lucide_react_1.Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"/>
                  </button>)}
                
                {onDelete && attachment._id && (<button onClick={function (e) { e.stopPropagation(); onDelete(attachment._id); }} className="p-1.5 bg-white dark:bg-gray-900 rounded-full shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group/del">
                     <lucide_react_1.Trash2 className="w-3.5 h-3.5 text-red-500 group-hover/del:text-red-600"/>
                  </button>)}
              </div>
            </div>);
        })}
      </div>

      {selectedImage && (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={function () { return setSelectedImage(null); }}>
          <div className="relative max-w-4xl max-h-full" onClick={function (e) { return e.stopPropagation(); }}>
            <button className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white transition-colors" onClick={function () { return setSelectedImage(null); }}>
              <lucide_react_1.X className="w-6 h-6"/>
            </button>
            <img src={getFullUrl(selectedImage.fileUrl)} alt={selectedImage.filename} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"/>
            <p className="text-white text-center mt-4 text-sm font-medium">{selectedImage.filename}</p>
          </div>
        </div>)}
    </div>);
};
exports.default = ImageGallery;
