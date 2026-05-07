import { useEffect, useMemo, useState } from 'react';
import { Equipment } from '../types';
import { equipmentService } from '../services/equipmentService';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { exportCSV, exportPDF, ExportColumn } from '../utils/exportUtils';
import { FileDown, FileText, Plus, Wrench, MapPin, Calendar } from 'lucide-react';
import EquipmentModal from '../components/EquipmentModal';
import EquipmentDetailModal from '../components/EquipmentDetailModal';
import ResourceManager from '../components/ResourceManager';
import Spinner from '../components/Spinner';

const EquipmentList = () => {
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

  const visibleEquipment = equipment;
  const canExport = visibleEquipment.length > 0;

  const equipmentColumns = useMemo<ExportColumn<Equipment>[]>(
    () => [
      { header: 'Name', value: (e) => e.name ?? '' },
      { header: 'Serial Number', value: (e) => e.serialNumber ?? '' },
      { header: 'Category', value: (e) => e.category ?? '' },
      { header: 'Location', value: (e) => e.location ?? '' },
      { header: 'Department', value: (e) => e.department ?? '' },
      { header: 'Status', value: (e) => e.status ?? '' },
      { header: 'Maintenance Team', value: (e) => e.maintenanceTeam?.name ?? '' },
      {
        header: 'Purchase Date',
        value: (e) => (e.purchaseDate ? new Date(e.purchaseDate).toLocaleDateString('en-GB') : ''),
      },
      { header: 'Open Requests', value: (e) => e.openRequestsCount ?? '' },
    ],
    []
  );

  const handleExportCSV = () => exportCSV(visibleEquipment, equipmentColumns);
  const handleExportPDF = async () => exportPDF(visibleEquipment, equipmentColumns, { title: 'Equipment' });

  if (loading) {
    return <Spinner size="lg" label="Loading equipment..." centered />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Equipment Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and monitor all equipment resources</p>
        </div>

        <div className="flex gap-2 justify-end">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Equipment
          </Button>
        </div>
      </div>

      <ResourceManager />

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Equipment</h3>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={handleExportCSV} disabled={!canExport}>
              <FileDown className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportPDF} disabled={!canExport}>
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleEquipment.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 p-6 cursor-pointer"
              onClick={() => setSelectedEquipment(item)}
              role="button"
              tabIndex={0}
            >
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{item.name}</h4>
                <Badge variant={statusColors[item.status]}>{item.status}</Badge>
              </div>

              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center">
                  <span className="font-medium mr-2">SN:</span>
                  <span className="truncate">{item.serialNumber}</span>
                </div>

                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="truncate">{item.location}</span>
                </div>

                {item.department && (
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Dept:</span>
                    <span className="truncate">{item.department}</span>
                  </div>
                )}

                {item.maintenanceTeam?.name && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">Team: {item.maintenanceTeam.name}</div>
                )}

                {item.purchaseDate && (
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3 w-3 mr-1" />
                    Purchased: {new Date(item.purchaseDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="flex items-center justify-between w-full text-sm text-primary-600 hover:text-primary-700 font-medium">
                  <span className="flex items-center">
                    <Wrench className="h-4 w-4 mr-2" />
                    Maintenance
                  </span>
                  {typeof item.openRequestsCount === 'number' && item.openRequestsCount > 0 && (
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
        <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <p className="text-gray-500 dark:text-gray-400">No equipment found. Add your first equipment to get started.</p>
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