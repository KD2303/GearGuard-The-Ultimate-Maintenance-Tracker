import { SparePart, PartUsedInput } from './inventory';

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface Equipment {
  _id?: string;
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  department?: string;
  assignedTo?: string;
  location: string;
  purchaseDate?: string;
  purchasePrice?: number;
  expectedLifespanYears?: number;
  salvageValue?: number;
  warrantyExpiry?: string;
  manufacturer?: string;
  model?: string;
  status: 'active' | 'inactive' | 'scrapped' | 'under-maintenance';
  licensePlate?: string;
  currentMileage?: number;
  fuelType?: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid' | 'CNG';
  notes?: string;
  /** Raw ObjectId string OR populated object (when returned from getEquipmentById) */
  maintenanceTeamId?: string | { _id: string; name: string; specialization?: string };
  maintenanceTeam?: MaintenanceTeam;
  /** Raw ObjectId string OR populated object (when returned from getEquipmentById) */
  defaultTechnicianId?: string | { _id: string; name: string; email?: string; role?: string };
  defaultTechnician?: TeamMember;
  openRequestsCount?: number;
  healthScore?: number;
  healthScoreBreakdown?: { factor: string; deduction: number }[];
  mapCoordinates?: { x: number; y: number };
  hourlyDowntimeCost?: number;
  history?: EquipmentHistoryEvent[];
  documents?: {
    _id?: string;
    title: string;
    fileUrl: string;
    fileType?: string;
    docCategory: 'Manual' | 'Schematic' | 'Safety' | 'Warranty' | 'Other';
    uploadedAt?: string;
    uploadedBy?: string;
  }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EquipmentHistoryEvent {
  _id?: string;
  eventType: 'PURCHASED' | 'CREATED' | 'STATUS_CHANGE' | 'REPAIR_COMPLETED' | 'ASSIGNED' | 'SCRAPPED';
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

export interface MaintenanceTeam {
  _id?: string;
  id: string;
  name: string;
  description?: string;
  specialization?: string;
  isActive: boolean;
  members?: TeamMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamMember {
  _id?: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  avatar?: string;
  points?: number;
  badges?: string[];
  isActive: boolean;
  teamId?: string;
  team?: MaintenanceTeam;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenanceRequest {
  _id?: string;
  id: string;
  requestNumber: string;
  subject: string;
  description?: string;
  type: 'corrective' | 'preventive';
  stage: 'new' | 'in-progress' | 'repaired' | 'scrap';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate?: string;
  completedDate?: string;
  duration?: number;
  cost?: number;
  partsCost?: number;
  laborCost?: number;
  notes?: string;
  equipmentId?: string;
  equipment?: Equipment;
  teamId?: string;
  team?: MaintenanceTeam;
  assignedToId?: string;
  assignedTo?: TeamMember;
  createdById?: string;
  createdBy?: TeamMember;
  partsUsed?: { partId: string | SparePart; quantityUsed: number }[];
  comments?: {
    _id?: string;
    authorId: string;
    authorName: string;
    content?: string;
    audioUrl?: string;
    audioDuration?: number;
    timestamp: string;
  }[];
  downtimeDurationHours?: number;
  totalDowntimeCost?: number;
  attachments?: {
    filename: string;
    fileUrl: string;
    fileType: string;
  }[];
  checklist?: { _id?: string; text: string; isCompleted: boolean }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEquipmentDto {
  name: string;
  serialNumber: string;
  category: string;
  department?: string;
  assignedTo?: string;
  location: string;
  purchaseDate?: string;
  purchasePrice?: number;
  expectedLifespanYears?: number;
  salvageValue?: number;
  warrantyExpiry?: string;
  manufacturer?: string;
  model?: string;
  status?: string;
  licensePlate?: string;
  currentMileage?: number;
  fuelType?: string;
  notes?: string;
  maintenanceTeamId?: string;
  defaultTechnicianId?: string;
  mapCoordinates?: { x: number; y: number };
  hourlyDowntimeCost?: number;
}

export interface CreateMaintenanceRequestDto {
  subject: string;
  description?: string;
  type: 'corrective' | 'preventive';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate?: string;
  equipmentId?: string;
  teamId?: string;
  assignedToId?: string;
  createdById?: string;
  attachments?: {
    filename: string;
    fileUrl: string;
    fileType: string;
  }[];
  partsUsed?: PartUsedInput[];
  checklist?: { text: string; isCompleted: boolean }[];
}

export interface Notification {
  _id: string;
  userId?: string;
  title?: string;
  type: 'request_created' | 'request_updated' | 'request_completed' | 'request_deleted' | 'system' | 'request_assigned' | 'request_overdue' | 'equipment_status' | 'general';
  message: string;
  requestId?: string;
  read?: boolean;
  isRead?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  link?: string;
  relatedRequestId?: string;
  relatedEquipmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface EquipmentHistoryEvent {
  _id?: string;
  eventType: 'PURCHASED' | 'CREATED' | 'STATUS_CHANGE' | 'REPAIR_COMPLETED' | 'ASSIGNED' | 'SCRAPPED';
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

export interface EquipmentFinancials {
  _id: string;
  name: string;
  serialNumber?: string;
  category: string;
  purchasePrice: number;
  salvageValue: number;
  lifespanYears: number;
  ageInYears: number;
  depreciatedValue: number;
  maintenanceCosts: {
    parts: number;
    labor: number;
    total: number;
    count: number;
  };
  isMoneyPit: boolean;
}

export interface RequestFilters {
  stage?: string;
  type?: string;
  priority?: string;
  teamId?: string;
  assignedToId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const defaultFilters: RequestFilters = {
  stage: '',
  type: '',
  priority: '',
  teamId: '',
  assignedToId: '',
  startDate: '',
  endDate: '',
  search: '',
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export interface SearchEquipmentResult {
  _id: string;
  name: string;
  serialNumber: string;
  category: string;
  location: string;
  status: string;
}

export interface SearchRequestResult {
  _id: string;
  requestNumber: string;
  subject: string;
  stage: string;
  priority: string;
  type: string;
  scheduledDate?: string;
  equipmentId?: {
    _id: string;
    name: string;
  };
  assignedToId?: {
    _id: string;
    name: string;
  };
}

export interface GlobalSearchResults {
  equipment: SearchEquipmentResult[];
  requests: SearchRequestResult[];
}

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface AuditLog {
  _id: string;
  entityType: string;
  entityId: string;
  userId?: { _id: string; name: string; email: string };
  userName?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  changes: AuditChange[];
  createdAt: string;
}

export interface ShiftHandover {
  _id: string;
  shiftDate: string;
  shiftType: 'Morning' | 'Afternoon' | 'Night';
  submittedBy: { _id: string; name: string; email: string };
  notes: string;
  safetyWarnings?: string;
  ongoingRepairs: Array<{
    _id: string;
    requestNumber: string;
    subject: string;
    stage: string;
    priority: string;
    equipment?: { name: string; status: string };
  }>;
  acknowledgedBy: Array<{ _id: string; name: string; email: string }>;
  createdAt: string;
}

export * from './activity';
export * from './inventory';
