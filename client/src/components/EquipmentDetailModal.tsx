import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Equipment, MaintenanceRequest } from '../types';
import { equipmentService } from '../services/equipmentService';
import Badge from './Badge';
import { Calendar, MapPin, Wrench, AlertCircle } from 'lucide-react';
import Spinner from './Spinner';

interface EquipmentDetailModalProps {
  equipment: Equipment;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void | Promise<void>;
}

const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  equipment,
  isOpen,
  onClose,
}) => {
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await equipmentService.getMaintenanceHistory(equipment.id);
        setMaintenanceHistory(history);
      } catch (error) {
        console.error('Failed to load maintenance history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (equipment.id) {
      loadHistory();
    }
  }, [equipment.id]);

  const statusColors = {
    active: 'success',
    inactive: 'default',
    scrapped: 'danger',
    'under-maintenance': 'warning',
  } as const;

  const openRequests = maintenanceHistory.filter((req) => req.stage !== 'repaired' && req.stage !== 'scrap');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={equipment.name} size="xl">
      <div className="space-y-6">
        {/* Equipment Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <Badge variant={statusColors[equipment.status]}>{equipment.status}</Badge>
          </div>
          <div>
            <p className="text-sm text-gray-500">Serial Number</p>
            <p className="font-medium">{equipment.serialNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <p className="font-medium">{equipment.category}</p>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium">{equipment.location}</p>
            </div>
          </div>
          {equipment.department && (
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium">{equipment.department}</p>
            </div>
          )}
          {equipment.assignedTo && (
            <div>
              <p className="text-sm text-gray-500">Assigned To</p>
              <p className="font-medium">{equipment.assignedTo}</p>
            </div>
          )}
          {equipment.manufacturer && (
            <div>
              <p className="text-sm text-gray-500">Manufacturer</p>
              <p className="font-medium">{equipment.manufacturer}</p>
            </div>
          )}
          {equipment.model && (
            <div>
              <p className="text-sm text-gray-500">Model</p>
              <p className="font-medium">{equipment.model}</p>
            </div>
          )}
          {equipment.purchaseDate && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Purchase Date</p>
                <p className="font-medium">
                  {new Date(equipment.purchaseDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          {equipment.warrantyExpiry && (
            <div>
              <p className="text-sm text-gray-500">Warranty Expiry</p>
              <p className="font-medium">
                {new Date(equipment.warrantyExpiry).toLocaleDateString()}
              </p>
            </div>
          )}
          {equipment.licensePlate && (
            <div>
              <p className="text-sm text-gray-500">License Plate</p>
              <p className="font-medium">{equipment.licensePlate}</p>
            </div>
          )}
          {equipment.currentMileage !== undefined && (
            <div>
              <p className="text-sm text-gray-500">Current Mileage</p>
              <p className="font-medium">{equipment.currentMileage.toLocaleString()} km</p>
            </div>
          )}
          {equipment.fuelType && (
            <div>
              <p className="text-sm text-gray-500">Fuel Type</p>
              <p className="font-medium">{equipment.fuelType}</p>
            </div>
          )}
        </div>

        {equipment.maintenanceTeam && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-500">Maintenance Team</p>
            <p className="font-medium">{equipment.maintenanceTeam.name}</p>
            {equipment.defaultTechnician && (
              <p className="text-sm text-gray-600 mt-1">
                Default Technician: {equipment.defaultTechnician.name}
              </p>
            )}
          </div>
        )}

        {equipment.notes && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Notes</p>
            <p className="text-gray-700">{equipment.notes}</p>
          </div>
        )}

        {/* Maintenance History - Smart Button */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold flex items-center">
              <Wrench className="h-5 w-5 mr-2" />
              Maintenance History
            </h4>
            {openRequests.length > 0 && (
              <Badge variant="warning">
                {openRequests.length} Open Request{openRequests.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="py-8"><Spinner size="md" label="Loading history..." /></div>
          ) : maintenanceHistory.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {maintenanceHistory.map((request) => (
                <div
                  key={request.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{request.subject}</p>
                      <p className="text-xs text-gray-500">{request.requestNumber}</p>
                    </div>
                    <Badge
                      variant={
                        request.stage === 'new'
                          ? 'info'
                          : request.stage === 'in-progress'
                          ? 'warning'
                          : request.stage === 'repaired'
                          ? 'success'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {request.stage}
                    </Badge>
                  </div>
                  {request.assignedTo && (
                    <p className="text-sm text-gray-600">
                      Assigned to: {request.assignedTo.name}
                    </p>
                  )}
                  {request.scheduledDate && (
                    <p className="text-sm text-gray-500">
                      Scheduled: {new Date(request.scheduledDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No maintenance history yet</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export default EquipmentDetailModal;
