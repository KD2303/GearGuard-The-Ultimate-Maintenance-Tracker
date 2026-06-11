"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RCAWizardModal;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var axios_1 = require("axios");
var react_hot_toast_1 = require("react-hot-toast");
function RCAWizardModal(_a) {
    var category = _a.category, onClose = _a.onClose, onComplete = _a.onComplete;
    var _b = (0, react_1.useState)([]), nodes = _b[0], setNodes = _b[1];
    var _c = (0, react_1.useState)(null), currentNode = _c[0], setCurrentNode = _c[1];
    var _d = (0, react_1.useState)(true), loading = _d[0], setLoading = _d[1];
    (0, react_1.useEffect)(function () {
        axios_1.default.get("/api/v1/diagnostics/".concat(category))
            .then(function (res) {
            var data = res.data.data;
            setNodes(data);
            var root = data.find(function (n) { return n.isRoot; });
            if (root) {
                setCurrentNode(root);
            }
            else {
                react_hot_toast_1.toast.error('No RCA Tree found for this category.');
                onClose();
            }
        })
            .catch(function (err) {
            console.error(err);
            react_hot_toast_1.toast.error('Failed to load RCA Tree.');
            onClose();
        })
            .finally(function () { return setLoading(false); });
    }, [category, onClose]);
    var handleEdgeClick = function (nextNodeId) {
        var nextNode = nodes.find(function (n) { return n._id === nextNodeId; });
        if (nextNode) {
            setCurrentNode(nextNode);
        }
        else {
            react_hot_toast_1.toast.error('Error: Linked node not found.');
        }
    };
    if (loading) {
        return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading Diagnostic Tree...</p>
        </div>
      </div>);
    }
    if (!currentNode)
        return null;
    var isLeaf = !currentNode.question && !!currentNode.rootCause;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <lucide_react_1.AlertTriangle className="w-5 h-5 text-amber-500 mr-2"/>
            Root Cause Analysis Wizard
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <lucide_react_1.X className="w-5 h-5"/>
          </button>
        </div>

        <div className="p-6 flex-1">
          {!isLeaf ? (<div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium uppercase tracking-wider">Question</p>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white leading-tight">
                  {currentNode.question}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 gap-3 pt-4">
                {currentNode.edges.map(function (edge, idx) { return (<button key={idx} onClick={function () { return handleEdgeClick(edge.nextNodeId); }} className="flex items-center justify-between p-4 rounded-xl border-2 border-blue-100 dark:border-blue-900/30 bg-white dark:bg-gray-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-200 transition-all group">
                    <span className="font-medium text-lg">{edge.answer}</span>
                    <lucide_react_1.ArrowRight className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
                  </button>); })}
              </div>
            </div>) : (<div className="text-center space-y-6 py-4">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <lucide_react_1.AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400"/>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium uppercase tracking-wider">Determined Root Cause</p>
                <h3 className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {currentNode.rootCause}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Please confirm this root cause to attach it to the maintenance ticket.
              </p>
              
              <div className="pt-6">
                <button onClick={function () { return onComplete(currentNode.rootCause, currentNode._id); }} className="w-full flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-500/30">
                  <lucide_react_1.CheckCircle className="w-5 h-5 mr-2"/>
                  Confirm & Attach Root Cause
                </button>
              </div>
            </div>)}
        </div>
      </div>
    </div>);
}
