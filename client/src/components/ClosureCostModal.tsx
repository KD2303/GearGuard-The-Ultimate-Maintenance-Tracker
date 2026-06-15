import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { DollarSign } from 'lucide-react';
import SignaturePad from './SignaturePad';
import toast from 'react-hot-toast';

interface ClosureCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (partsCost: number, laborCost: number, signatureBase64: string) => void;
  title: string;
}

const ClosureCostModal: React.FC<ClosureCostModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
}) => {
  const [partsCost, setPartsCost] = useState<string>('');
  const [laborCost, setLaborCost] = useState<string>('');
  const [signature, setSignature] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature) {
      toast.error('A digital signature is legally required to close this ticket.');
      return;
    }
    const parsedParts = parseFloat(partsCost) || 0;
    const parsedLabor = parseFloat(laborCost) || 0;
    onSubmit(parsedParts, parsedLabor, signature);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Please enter the final costs associated with this maintenance request to ensure accurate tracking for our Asset Depreciation and Financial Health metrics.
        </p>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Parts Cost ($)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={partsCost}
              onChange={(e) => setPartsCost(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Labor Cost ($)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={laborCost}
              onChange={(e) => setLaborCost(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="0.00"
            />
          </div>
        </div>

        <SignaturePad onSign={setSignature} />

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Skip / Cancel
          </Button>
          <Button type="submit">
            Save & Complete
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ClosureCostModal;
