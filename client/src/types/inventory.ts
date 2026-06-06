export interface SparePart {
  _id?: string;
  id?: string;
  name: string;
  sku: string;
  quantityInStock: number;
  quantityReserved?: number;
  unitCost: number;
  minReorderThreshold: number;
  supplierEmail?: string;
  location?: string;
  reorderStatus?: 'ok' | 'low-stock' | 'reordered';
  createdAt?: string;
  updatedAt?: string;
}

export interface PartUsedInput {
  partId: string;
  quantityUsed: number;
}

export interface PartRequiredInput {
  partId: string;
  quantityNeeded: number;
}
