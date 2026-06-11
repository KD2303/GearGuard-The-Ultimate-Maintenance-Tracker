import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Equipment } from '../types';
import { equipmentService } from '../services/equipmentService';
import { requestService } from '../services/requestService';
import { Loader2, Wrench, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CannibalizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestId: string;
  partId: string;
  partName: string;
  quantityNeeded: number;
  currentEquipmentId: string;
}

const CannibalizeModal: React.FC<CannibalizeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  requestId,
  partId,
  partName,
  quantityNeeded,
  currentEquipmentId
}) => {
  const [compatibleEquipment, setCompatibleEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(quantityNeeded);

  useEffect(() => {
    if (isOpen && partId) {
      fetchCompatibleEquipment();
      setQuantity(quantityNeeded);
      setSelectedEquipmentId('');
    }
  }, [isOpen, partId, quantityNeeded]);

  const fetchCompatibleEquipment = async () => {
    try {
      setLoading(true);
      const data = await equipmentService.getCompatibleWithPart(partId, currentEquipmentId);
      setCompatibleEquipment(data);
      if (data.length > 0) {
        setSelectedEquipmentId(data[0]._id || '');
      }
    } catch (error) {
      console.error('Failed to fetch compatible equipment:', error);
      toast.error('Failed to load compatible equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleCannibalize = async () => {
    if (!selectedEquipmentId) {
      toast.error('Please select a donor equipment');
      return;
    }
    
    if (quantity <= 0 || quantity > quantityNeeded) {
      toast.error(`Quantity must be between 1 and ${quantityNeeded}`);
      return;
    }

    try {
      setSubmitting(true);
      await requestService.cannibalizePart(requestId, partId, selectedEquipmentId, quantity);
      onSuccess();
    } catch (error: any) {
      console.error('Cannibalization failed:', error);
      toast.error(error.response?.data?.error || 'Failed to cannibalize part');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cannibalize Part">
      <div className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                You are about to harvest <strong>{partName}</strong> from another machine. This will auto-generate a high-priority sub-ticket to remove the part from the donor machine.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-500">Finding compatible machines...</span>
          </div>
        ) : compatibleEquipment.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p>No compatible donor equipment found for this part.</p>
            <p className="text-sm mt-1">Make sure compatible parts are assigned in the Equipment settings.</p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Donor Machine
              </label>
              <select
                value={selectedEquipmentId}
                onChange={(e) => setSelectedEquipmentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Select a machine...</option>
                {compatibleEquipment.map((eq) => (
                  <option key={eq._id} value={eq._id}>
                    {eq.name} ({eq.serialNumber}) - Status: {eq.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantity to Cannibalize
              </label>
              <input
                type="number"
                min="1"
                max={quantityNeeded}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCannibalize}
                disabled={submitting || !selectedEquipmentId}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed flex items-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Cannibalization'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default CannibalizeModal;
