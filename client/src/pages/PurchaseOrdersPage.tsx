import React, { useState, useEffect } from 'react';
import { purchaseOrderService, PurchaseOrder } from '../services/purchaseOrderService';
import toast from 'react-hot-toast';
import { Package, Truck, CheckCircle, Mail, Clock } from 'lucide-react';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';

const PurchaseOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await purchaseOrderService.getPurchaseOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'ordered' | 'received') => {
    try {
      await purchaseOrderService.updateStatus(id, newStatus);
      toast.success(`Purchase order marked as ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" /> Draft</Badge>;
      case 'ordered':
        return <Badge variant="info"><Truck className="w-3 h-3 mr-1" /> Ordered</Badge>;
      case 'received':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Received</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <Package className="mr-2" /> Purchase Orders
          </h1>
          <p className="text-slate-500 mt-1">Manage draft orders and incoming stock shipments.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Part Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Qty</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                orders.map((po) => (
                  <tr key={po._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{po.partId?.name || 'Unknown Part'}</div>
                      <div className="text-sm text-slate-500">SKU: {po.partId?.sku} | In Stock: {po.partId?.quantityInStock}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {po.quantityNeeded} units
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center"><Mail className="w-4 h-4 mr-1 text-slate-400" /> {po.supplierEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(po.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {po.status === 'draft' && (
                        <Button size="sm" onClick={() => handleUpdateStatus(po._id, 'ordered')}>
                          Approve & Order
                        </Button>
                      )}
                      {po.status === 'ordered' && (
                        <Button size="sm" variant="success" onClick={() => handleUpdateStatus(po._id, 'received')}>
                          Mark Received
                        </Button>
                      )}
                      {po.status === 'received' && (
                        <span className="text-sm text-slate-400 italic">Inventory Updated</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrdersPage;
