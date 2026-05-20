import api from './api';
import { SparePart } from '../types';
import toast from 'react-hot-toast';

export const inventoryService = {
  getAll: async (search?: string, lowStock?: boolean): Promise<SparePart[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (lowStock !== undefined) params.append('lowStock', String(lowStock));
    
    const response = await api.get(`/inventory?${params.toString()}`);
    return response.data.data || response.data;
  },

  getById: async (id: string): Promise<SparePart> => {
    const response = await api.get(`/inventory/${id}`);
    return response.data.data || response.data;
  },

  create: async (data: Partial<SparePart>): Promise<SparePart> => {
    const response = await api.post('/inventory', data);
    toast.success('Spare part added successfully');
    return response.data.data || response.data;
  },

  update: async (id: string, data: Partial<SparePart>): Promise<SparePart> => {
    const response = await api.put(`/inventory/${id}`, data);
    toast.success('Spare part updated successfully');
    return response.data.data || response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/inventory/${id}`);
    toast.success('Spare part deleted successfully');
  },

  reorder: async (id: string, reorderQuantity: number): Promise<SparePart> => {
    const response = await api.post(`/inventory/${id}/reorder`, { reorderQuantity });
    toast.success('Procurement order dispatched!');
    return response.data.data || response.data;
  },
};
