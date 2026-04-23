import { useState, useEffect } from 'react';
import { Equipment } from '../types';
import { equipmentService } from '../services/equipmentService';
import Badge from './Badge';
import Button from './Button';
import { Calendar, MapPin, Wrench, AlertCircle, CheckCircle, Package } from 'lucide-react';
import Spinner from './Spinner';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'gradient';

const ResourceManager = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const data = await equipmentService.getAll();
      setEquipment(data);
      if (data.length > 0) {
        setSelectedEquipment(data[0]);
      }
    } catch (error) {
      console.error('Failed to load equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'under-maintenance':
        return <Wrench className="w-5 h-5 text-yellow-500" />;
      case 'inactive':
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
      case 'scrapped':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string): BadgeVariant => {
    switch (status) {
      case 'active':
        return 'success';
      case 'under-maintenance':
        return 'warning';
      case 'inactive':
        return 'default';
      case 'scrapped':
        return 'danger';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex justify-center items-center h-[200px]">
        <Spinner size="md" label="Loading equipment..." />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">Resource Manager</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Equipment List */}
        <div className="border-r border-gray-200 p-4 max-h-[600px] overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-700 mb-3">All Equipment</h3>
          <div className="space-y-2">
            {equipment.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedEquipment(item)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedEquipment?.id === item.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{item.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.serialNumber}</div>
                  </div>
                  <div className="ml-2">{getStatusIcon(item.status)}</div>
                </div>
                <div className="mt-2">
                  <Badge variant={getStatusColor(item.status)} size="sm">
                    {item.status.replace('-', ' ')}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Equipment Details */}
        <div className="col-span-2 p-6">
          {selectedEquipment ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedEquipment.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">SN: {selectedEquipment.serialNumber}</p>
                </div>
                <Badge variant={getStatusColor(selectedEquipment.status)}>
                  {selectedEquipment.status.replace('-', ' ')}
                </Badge>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Category</div>
                    <div className="font-medium text-gray-900">{selectedEquipment.category}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Location</div>
                    <div className="font-medium text-gray-900">{selectedEquipment.location}</div>
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Specifications</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedEquipment.manufacturer && (
                    <div>
                      <div className="text-sm text-gray-500">Manufacturer</div>
                      <div className="font-medium text-gray-900">{selectedEquipment.manufacturer}</div>
                    </div>
                  )}
                  {selectedEquipment.model && (
                    <div>
                      <div className="text-sm text-gray-500">Model</div>
                      <div className="font-medium text-gray-900">{selectedEquipment.model}</div>
                    </div>
                  )}
                  {selectedEquipment.department && (
                    <div>
                      <div className="text-sm text-gray-500">Department</div>
                      <div className="font-medium text-gray-900">{selectedEquipment.department}</div>
                    </div>
                  )}
                  {selectedEquipment.assignedTo && (
                    <div>
                      <div className="text-sm text-gray-500">Assigned To</div>
                      <div className="font-medium text-gray-900">{selectedEquipment.assignedTo}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Important Dates</h4>
                <div className="space-y-3">
                  {selectedEquipment.purchaseDate && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">Purchase Date</div>
                        <div className="font-medium text-gray-900">
                          {new Date(selectedEquipment.purchaseDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedEquipment.warrantyExpiry && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">Warranty Expiry</div>
                        <div className="font-medium text-gray-900">
                          {new Date(selectedEquipment.warrantyExpiry).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Maintenance Info */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Maintenance</h4>
                <div className="space-y-2">
                  {selectedEquipment.maintenanceTeam && (
                    <div>
                      <div className="text-sm text-gray-500">Assigned Team</div>
                      <div className="font-medium text-gray-900">{selectedEquipment.maintenanceTeam.name}</div>
                    </div>
                  )}
                  {selectedEquipment.defaultTechnician && (
                    <div>
                      <div className="text-sm text-gray-500">Default Technician</div>
                      <div className="font-medium text-gray-900">{selectedEquipment.defaultTechnician.name}</div>
                    </div>
                  )}
                  {selectedEquipment.openRequestsCount !== undefined && (
                    <div>
                      <div className="text-sm text-gray-500">Open Requests</div>
                      <div className="font-medium text-gray-900">{selectedEquipment.openRequestsCount}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedEquipment.notes && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Notes</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedEquipment.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <Button variant="primary" size="sm">
                  <Wrench className="w-4 h-4 mr-2" />
                  Create Maintenance Request
                </Button>
                <Button variant="secondary" size="sm">
                  Edit Equipment
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Select an equipment to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceManager;
