"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var Button_1 = require("../Button");
var AlertRulesConfig = function (_a) {
    var equipmentId = _a.equipmentId;
    var _b = (0, react_1.useState)('temperature'), metric = _b[0], setMetric = _b[1];
    var _c = (0, react_1.useState)('>'), condition = _c[0], setCondition = _c[1];
    var _d = (0, react_1.useState)(''), threshold = _d[0], setThreshold = _d[1];
    var handleSave = function () {
        // In a real app, send this to the backend
        console.log("Saved rule: IF ".concat(metric, " ").concat(condition, " ").concat(threshold, " THEN Create High Priority Request"));
        setThreshold('');
    };
    return (<div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Automated Alert Rules
      </h3>
      <p className="text-sm text-gray-500 mb-4">Configure threshold rules to automatically trigger maintenance requests when anomalies are detected.</p>
      
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IF Metric</label>
          <select className="w-40 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2" value={metric} onChange={function (e) { return setMetric(e.target.value); }}>
            <option value="temperature">Temperature</option>
            <option value="vibration">Vibration</option>
            <option value="pressure">Pressure</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Is</label>
          <select className="w-20 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2" value={condition} onChange={function (e) { return setCondition(e.target.value); }}>
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
            <option value="==">==</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Value</label>
          <input type="number" className="w-24 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2" value={threshold} placeholder="e.g. 85" onChange={function (e) { return setThreshold(e.target.value); }}/>
        </div>

        <div className="ml-auto">
          <Button_1.default onClick={handleSave} disabled={!threshold}>Add Rule</Button_1.default>
        </div>
      </div>
    </div>);
};
exports.default = AlertRulesConfig;
