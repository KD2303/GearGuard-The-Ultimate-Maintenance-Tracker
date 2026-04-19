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
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenanceTeam {
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
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  avatar?: string;
  isActive: boolean;
  teamId?: string;
  team?: MaintenanceTeam;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenanceRequest {
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
  notes?: string;
  equipmentId?: string;
  equipment?: Equipment;
  teamId?: string;
  team?: MaintenanceTeam;
  assignedToId?: string;
  assignedTo?: TeamMember;
  createdById?: string;
  createdBy?: TeamMember;
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
}

export interface Notification {
  _id: string;
  type: 'request_created' | 'request_updated' | 'request_completed' | 'request_deleted' | 'system';
  message: string;
  requestId?: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
}

export * from './activity';
