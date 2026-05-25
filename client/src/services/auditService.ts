import api from "./api";
import { AuditLog } from "../types";

export const auditService = {
  getAuditTrail: async (entityType: string, entityId: string): Promise<AuditLog[]> => {
    const response = await api.get(`/audit/${entityType}/${entityId}`);
    return response.data;
  },
};
