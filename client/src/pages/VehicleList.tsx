import React, { useState, useEffect } from 'react';
import { Equipment } from '../types';
import { equipmentService } from '../services/equipmentService';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { Plus, Wrench, MapPin, Car, Gauge, Fuel } from 'lucide-react';
import EquipmentModal from '../components/EquipmentModal';
import EquipmentDetailModal from '../components/EquipmentDetailModal';
import Spinner from '../components/Spinner';

const VehicleList: React.FC = () => {
  const [vehicles, setVehicles] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Equipment | null>(null);

  const loadVehicles = async () => {
    try {
      const data = await equipmentService.getAll();
      // Filter for vehicles only
      const filtered = data.filter(item => item.category.toLowerCase() === 'vehicle');
      setVehicles(filtered);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const statusColors = {
    active: 'success',
    inactive: 'default',
    scrapped: 'danger',
    'under-maintenance': 'warning',
  } as const;

  if (loading) {
    return <Spinner size="lg" label="Loading vehicles..." centered />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vehicle Fleet Management</h2>
          <p className="text-gray-600 mt-1">Track and maintain company vehicles and transport assets</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 p-6 cursor-pointer transform hover:-translate-y-1"
            onClick={() => setSelectedVehicle(item)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Car className="h-6 w-6 text-orange-600" />
              </div>
              <Badge variant={statusColors[item.status]}>
                {item.status}
              </Badge>
            </div>

            <h3 className="font-bold text-xl text-gray-900 mb-2">{item.name}</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">License Plate</p>
                <p className="text-sm font-bold text-gray-900">{item.licensePlate || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Mileage</p>
                <div className="flex items-center">
                  <Gauge className="h-3 w-3 mr-1 text-gray-400" />
                  <p className="text-sm font-bold text-gray-900">{item.currentMileage?.toLocaleString() || 0} km</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-600 border-t pt-4">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                {item.location}
              </div>

              {item.fuelType && (
                <div className="flex items-center">
                  <Fuel className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-medium mr-1">Fuel:</span> {item.fuelType}
                </div>
              )}

              {item.maintenanceTeam && (
                <div className="flex items-center">
                  <Wrench className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-medium mr-1">Team:</span> {item.maintenanceTeam.name}
                </div>
              )}
            </div>

            {/* Smart Button */}
            <div className="mt-6">
              <button className="flex items-center justify-center w-full py-2.5 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors text-sm font-bold">
                <Wrench className="h-4 w-4 mr-2" />
                Maintenance History
                {item.openRequestsCount !== undefined && item.openRequestsCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-orange-600 text-white text-[10px] rounded-full">
                    {item.openRequestsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200">
          <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No vehicles tracked</h3>
          <p className="text-gray-500 mt-1">Start by adding your first company vehicle.</p>
          <Button onClick={() => setIsModalOpen(true)} className="mt-6" variant="secondary">
            Add New Vehicle
          </Button>
        </div>
      )}

      {isModalOpen && (
        <EquipmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            loadVehicles();
          }}
        />
      )}

      {selectedVehicle && (
        <EquipmentDetailModal
          equipment={selectedVehicle}
          isOpen={!!selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onUpdate={loadVehicles}
        />
      )}
    </div>
  );
};

export default VehicleList;
