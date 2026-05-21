import api from './api';

export interface PurchaseOrder {
  _id: string;
  partId: {
    _id: string;
    name: string;
    sku: string;
    minReorderThreshold: number;
    quantityInStock: number;
    unitCost: number;
  };
  quantityNeeded: number;
  status: 'draft' | 'ordered' | 'received';
  supplierEmail: string;
  createdAt: string;
  updatedAt: string;
}

export const purchaseOrderService = {
  getPurchaseOrders: async (status?: string): Promise<PurchaseOrder[]> => {
    const url = status ? `/purchase-orders?status=${status}` : '/purchase-orders';
    const response = await api.get(url);
    return response.data;
  },

  updateStatus: async (id: string, status: 'ordered' | 'received'): Promise<any> => {
    const response = await api.put(`/purchase-orders/${id}/status`, { status });
    return response.data;
  },

  deletePurchaseOrder: async (id: string): Promise<any> => {
    const response = await api.delete(`/purchase-orders/${id}`);
    return response.data;
  }
};
