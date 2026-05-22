import React, { useEffect, useState } from 'react';
import { PackageSearch, Send, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { procurementService, ForecastItem, PurchaseOrder } from '../services/procurementService';
import toast from 'react-hot-toast';

const ProcurementDashboard: React.FC = () => {
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [drafts, setDrafts] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [forecastData, draftsData] = await Promise.all([
        procurementService.getForecast(),
        procurementService.getPurchaseOrders('draft')
      ]);
      setForecast(forecastData);
      setDrafts(draftsData);
    } catch (error) {
      toast.error('Failed to load procurement data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAutoDraft = async () => {
    try {
      const res = await procurementService.autoDraftPOs();
      if (res.draftsCreated > 0) {
        toast.success(`Successfully drafted ${res.draftsCreated} Purchase Orders!`);
        fetchData();
      } else {
        toast.success('No new shortages detected. Stock levels are healthy.');
      }
    } catch (error) {
      toast.error('Failed to auto-draft POs');
    }
  };

  const handleApprovePO = async (id: string) => {
    try {
      await procurementService.updatePOStatus(id, 'sent');
      toast.success('Purchase Order Sent to Supplier!');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve PO');
    }
  };

  // Prepare chart data (simple mock timeline based on forecast)
  const chartData = forecast.map(item => ({
    name: item.name,
    stock: item.currentStock,
    demand: item.projectedDemand,
    shortage: Math.abs(Math.min(0, item.projectedStock))
  }));

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Procurement Hub</h1>
          <p className="text-gray-600 dark:text-gray-400">Automated Supply Chain & Forecasting</p>
        </div>
        <button 
          onClick={handleAutoDraft}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors"
        >
          <PackageSearch className="w-5 h-5 mr-2" />
          Run Auto-Draft Engine
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">30-Day Demand vs Stock</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="stock" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Current Stock" />
                <Area type="monotone" dataKey="shortage" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Projected Shortage" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shortage List */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-y-auto max-h-80">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
            Projected Shortages
          </h2>
          {forecast.length === 0 ? (
            <p className="text-gray-500">No shortages projected in the next 30 days.</p>
          ) : (
            <div className="space-y-3">
              {forecast.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{item.name} <span className="text-xs text-gray-500">({item.sku})</span></p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Demand: {item.projectedDemand} | Stock: {item.currentStock}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-500">Short: {Math.abs(item.projectedStock)}</p>
                    <p className="text-xs text-gray-500">Suggested Order: {item.suggestedOrderQuantity}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Drafts */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <Clock className="w-5 h-5 text-blue-500 mr-2" />
          Pending Purchase Orders (Drafts)
        </h2>
        {drafts.length === 0 ? (
          <p className="text-gray-500">No draft purchase orders pending approval.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="p-3 rounded-tl-lg">PO Number</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Total Cost</th>
                  <th className="p-3 text-right rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map(po => (
                  <tr key={po._id} className="border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <td className="p-3 font-medium text-gray-800 dark:text-white">{po.poNumber}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{po.supplierId?.name || 'Unknown'}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{po.items.length} items</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">${po.totalCost.toFixed(2)}</td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => handleApprovePO(po._id)}
                        className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 rounded-md transition-colors"
                      >
                        <Send className="w-4 h-4 mr-1" /> Approve & Send
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcurementDashboard;
