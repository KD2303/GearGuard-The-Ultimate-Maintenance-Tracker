import React, { useState, useEffect } from 'react';
import { Equipment } from '../types';
import { equipmentService } from '../services/equipmentService';
import Badge from '../components/Badge';
import Button from '../components/Button';
// @ts-ignore
import Papa from 'papaparse';
import { Plus, Wrench, MapPin, Calendar } from 'lucide-react';
import EquipmentModal from '../components/EquipmentModal';
import EquipmentDetailModal from '../components/EquipmentDetailModal';
import ResourceManager from '../components/ResourceManager';
import Spinner from '../components/Spinner';

const EquipmentList: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const loadEquipment = async () => {
    try {
      const data = await equipmentService.getAll();
      setEquipment(data);
    } catch (error) {
      console.error('Failed to load equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, []);

  const statusColors = {
    active: 'success',
    inactive: 'default',
    scrapped: 'danger',
    'under-maintenance': 'warning',
  } as const;

  const handleExport = () => {
    if (!equipment || equipment.length === 0) return;

    const exportData = equipment.map((item) => ({
      Name: item.name,
      SerialNumber: item.serialNumber,
      Location: item.location,
      Department: item.department || '',
      Status: item.status,
      'Maintenance Team': item.maintenanceTeam?.name || '',
      'Purchase Date': item.purchaseDate
        ? new Date(item.purchaseDate).toLocaleDateString('en-GB')
        : '',
    }));

    const csv = Papa.unparse(exportData);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'equipment-records.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <Spinner size="lg" label="Loading equipment..." centered />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Equipment Management</h2>
          <p className="text-gray-600 mt-1">Manage and monitor all equipment resources</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleExport}>Export CSV</Button>

          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Equipment
          </Button>
        </div>
      </div>

      <ResourceManager />

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Equipment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer"
              onClick={() => setSelectedEquipment(item)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                <Badge variant={statusColors[item.status]}>
                  {item.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="font-medium mr-2">SN:</span>
                  {item.serialNumber}
                </div>

                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {item.location}
                </div>

                {item.department && (
                  <div className="flex items-center">
                    <span className="font-medium">Dept:</span>
                    <span className="ml-2">{item.department}</span>
                  </div>
                )}

                {item.maintenanceTeam && (
                  <div className="text-xs text-gray-500">
                    Team: {item.maintenanceTeam.name}
                  </div>
                )}

                {item.purchaseDate && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    Purchased: {new Date(item.purchaseDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <button className="flex items-center justify-between w-full text-sm text-primary-600 hover:text-primary-700 font-medium">
                  <span className="flex items-center">
                    <Wrench className="h-4 w-4 mr-2" />
                    Maintenance
                  </span>
                  {item.openRequestsCount !== undefined && item.openRequestsCount > 0 && (
                    <Badge variant="warning" size="sm">
                      {item.openRequestsCount}
                    </Badge>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {equipment.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No equipment found. Add your first equipment to get started.</p>
        </div>
      )}

      {isModalOpen && (
        <EquipmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            loadEquipment();
          }}
        />
      )}

      {selectedEquipment && (
        <EquipmentDetailModal
          equipment={selectedEquipment}
          isOpen={!!selectedEquipment}
          onClose={() => setSelectedEquipment(null)}
          onUpdate={loadEquipment}
        />
      )}
    </div>
  );
};

export default EquipmentList;