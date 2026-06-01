import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Equipment, MaintenanceRequest } from '../types';
import { equipmentService } from '../services/equipmentService';
import { getRelativeDateLabel } from '../utils/dateUtils';
import Badge from './Badge';
import { Calendar, MapPin, Wrench, AlertCircle } from 'lucide-react';
import Spinner from './Spinner';
import RequestModal from './RequestModal';
import ExportButton from './ExportButton';
import { exportEquipmentPDF } from '../services/exportService';
import EquipmentHistoryTimeline from './EquipmentHistoryTimeline';
import HealthRing from './HealthRing';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode } from 'lucide-react';
import TelemetryChart from './telemetry/TelemetryChart';
import AlertRulesConfig from './telemetry/AlertRulesConfig';

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
  onUpdate,
}) => {
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const history = await equipmentService.getMaintenanceHistory(equipment.id);
      setMaintenanceHistory(history);
    } catch (error) {
      console.error('Failed to load maintenance history:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById("qr-gen") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${equipment.name.replace(/\s+/g, '_')}-QR-Badge.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  useEffect(() => {
    if (equipment.id && isOpen) {
      loadHistory();
    }
  }, [equipment.id, isOpen]);

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
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <HealthRing score={equipment.healthScore ?? 100} size={80} strokeWidth={6} breakdown={equipment.healthScoreBreakdown} />
            <div className="mt-3 flex flex-col items-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 tracking-wider uppercase">System Status</p>
              <Badge variant={statusColors[equipment.status]}>{equipment.status}</Badge>
            </div>
          </div>
          <div className="flex flex-col justify-center space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Serial Number</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.serialNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.category}</p>
            </div>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.location}</p>
            </div>
          </div>
          {equipment.department && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.department}</p>
            </div>
          )}
          {equipment.assignedTo && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Assigned To</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.assignedTo}</p>
            </div>
          )}
          {equipment.manufacturer && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manufacturer</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.manufacturer}</p>
            </div>
          )}
          {equipment.model && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Model</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.model}</p>
            </div>
          )}
          {equipment.purchaseDate && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Purchase Date</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(equipment.purchaseDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          {equipment.warrantyExpiry && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Warranty Expiry</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(equipment.warrantyExpiry).toLocaleDateString()}
              </p>
            </div>
          )}
          {equipment.licensePlate && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">License Plate</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.licensePlate}</p>
            </div>
          )}
          {equipment.currentMileage !== undefined && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Mileage</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.currentMileage.toLocaleString()} km</p>
            </div>
          )}
          {equipment.fuelType && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fuel Type</p>
              <p className="font-medium text-gray-900 dark:text-white">{equipment.fuelType}</p>
            </div>
          )}
        </div>

        {equipment.maintenanceTeam && (
          <div className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg transition-colors">
            <p className="text-sm text-gray-600 dark:text-gray-400">Maintenance Team</p>
            <p className="font-medium text-gray-900 dark:text-white">{equipment.maintenanceTeam.name}</p>
            {equipment.defaultTechnician && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Default Technician: {equipment.defaultTechnician.name}
              </p>
            )}
          </div>
        )}

        {equipment.notes && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Notes</p>
            <p className="text-gray-700 dark:text-gray-200">{equipment.notes}</p>
          </div>
        )}

        {/* Maintenance History - Smart Button */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
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
            <div className="py-8 text-gray-600 dark:text-gray-400">
              <Spinner size="md" label="Loading history..." />
            </div>
          ) : maintenanceHistory.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {maintenanceHistory.map((request) => (
                <div
                  key={request.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{request.subject}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{request.requestNumber}</p>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Assigned to: {request.assignedTo.name}
                    </p>
                  )}
                  {request.scheduledDate && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <span>Scheduled: {new Date(request.scheduledDate).toLocaleDateString()}</span>
                      {request.stage !== "repaired" && request.stage !== "scrap" && (
                        <span className={`ml-2 font-medium ${getRelativeDateLabel(request.scheduledDate).colorClass}`}>
                          {getRelativeDateLabel(request.scheduledDate).label}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No maintenance history yet</p>
            </div>
          )}
        </div>

        {/* Telemetry Charts & Rules */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              Real-time Telemetry
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TelemetryChart equipmentId={equipment.id || (equipment as any)._id || ''} metricType="temperature" />
            <TelemetryChart equipmentId={equipment.id || (equipment as any)._id || ''} metricType="vibration" />
          </div>
          <AlertRulesConfig equipmentId={equipment.id || (equipment as any)._id || ''} />
        </div>

        {/* Equipment Audit History */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              Equipment History
            </h4>
          </div>
          <div className="bg-slate-900 rounded-lg p-6 max-h-[400px] overflow-y-auto">
            <EquipmentHistoryTimeline history={equipment.history || []} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div style={{ display: 'none' }}>
            <QRCodeCanvas
              id="qr-gen"
              value={`${window.location.origin}/requests?action=newRequest&equipmentId=${equipment.id || (equipment as any)._id}`}
              size={512}
              level={"H"}
              includeMargin={true}
            />
          </div>
          <Button variant="secondary" onClick={downloadQRCode}>
            <QrCode className="h-4 w-4 mr-2" />
            Download QR Badge
          </Button>
          <ExportButton
            label="Download PDF Report"
            onClick={() => exportEquipmentPDF(equipment.id || (equipment as any)._id || '', equipment.name)}
            variant="pdf"
          />
          <Button variant="primary" onClick={() => setIsRequestModalOpen(true)}>
            <Wrench className="h-4 w-4 mr-2" />
            Request Maintenance
            {openRequests.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-white text-blue-600 rounded-full">
                {openRequests.length}
              </span>
            )}
          </Button>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
      {isRequestModalOpen && (
        <RequestModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          onSuccess={async () => {
            setIsRequestModalOpen(false);
            await loadHistory();
            if (onUpdate) {
              await onUpdate();
            }
          }}
          initialEquipmentId={equipment.id}
        />
      )}
    </Modal>
  );
};

export default EquipmentDetailModal;
