import api from './api';

export interface ForecastItem {
  partId: string;
  name: string;
  sku: string;
  supplierId?: string;
  currentStock: number;
  projectedDemand: number;
  projectedStock: number;
  minReorderThreshold: number;
  suggestedOrderQuantity: number;
  unitCost: number;
}

export interface Supplier {
  _id: string;
  name: string;
  contactEmail?: string;
  phone?: string;
  leadTimeDays: number;
  notes?: string;
}

export interface PaginatedSuppliers {
  suppliers: Supplier[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface PurchaseOrderItem {
  partId: any;
  quantityNeeded: number;
  unitCost: number;
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplierId: any;
  items: PurchaseOrderItem[];
  totalCost: number;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  orderDate?: string;
  expectedDeliveryDate?: string;
  createdAt: string;
}

export const procurementService = {
  getForecast: async (): Promise<ForecastItem[]> => {
    const response = await api.get('/procurement/forecast');
    return response.data;
  },
  
  autoDraftPOs: async (): Promise<{ success: boolean; draftsCreated: number; drafts: PurchaseOrder[] }> => {
    const response = await api.post('/procurement/auto-draft');
    return response.data;
  },

  getPurchaseOrders: async (status?: string): Promise<PurchaseOrder[]> => {
    const params = status ? { status } : {};
    const response = await api.get('/purchase-orders', { params });
    return response.data;
  },

  updatePOStatus: async (id: string, status: string): Promise<PurchaseOrder> => {
    const response = await api.put(`/purchase-orders/${id}/status`, { status });
    return response.data.purchaseOrder;
  },

  getSuppliers: async (page: number = 1, limit: number = 20): Promise<PaginatedSuppliers> => {
    const response = await api.get('/suppliers', { params: { page, limit } });
    return response.data;
  }
};
