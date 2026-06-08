"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var Modal_1 = require("./Modal");
var Button_1 = require("./Button");
var lucide_react_1 = require("lucide-react");
var ClosureCostModal = function (_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose, onSubmit = _a.onSubmit, title = _a.title;
    var _b = (0, react_1.useState)(''), partsCost = _b[0], setPartsCost = _b[1];
    var _c = (0, react_1.useState)(''), laborCost = _c[0], setLaborCost = _c[1];
    var handleSubmit = function (e) {
        e.preventDefault();
        var parsedParts = parseFloat(partsCost) || 0;
        var parsedLabor = parseFloat(laborCost) || 0;
        onSubmit(parsedParts, parsedLabor);
    };
    return (<Modal_1.default isOpen={isOpen} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Please enter the final costs associated with this maintenance request to ensure accurate tracking for our Asset Depreciation and Financial Health metrics.
        </p>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Parts Cost ($)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <lucide_react_1.DollarSign className="h-4 w-4 text-gray-400"/>
            </div>
            <input type="number" min="0" step="0.01" value={partsCost} onChange={function (e) { return setPartsCost(e.target.value); }} className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="0.00"/>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Labor Cost ($)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <lucide_react_1.DollarSign className="h-4 w-4 text-gray-400"/>
            </div>
            <input type="number" min="0" step="0.01" value={laborCost} onChange={function (e) { return setLaborCost(e.target.value); }} className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="0.00"/>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button_1.default type="button" variant="secondary" onClick={onClose}>
            Skip / Cancel
          </Button_1.default>
          <Button_1.default type="submit">
            Save & Complete
          </Button_1.default>
        </div>
      </form>
    </Modal_1.default>);
};
exports.default = ClosureCostModal;
