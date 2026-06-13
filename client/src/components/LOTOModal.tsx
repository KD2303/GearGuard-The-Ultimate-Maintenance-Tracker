import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { MaintenanceRequest } from '../types';
import { ShieldAlert, CheckCircle2, Upload, Loader2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { requestService } from '../services/requestService';

interface LOTOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestRecord: MaintenanceRequest;
}

const LOTOModal: React.FC<LOTOModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  requestRecord,
}) => {
  const equipment = requestRecord.equipment;
  const lotoChecklist = equipment?.lotoChecklist || [];
  
  const [checklistResponses, setChecklistResponses] = useState<{ step: string; checked: boolean }[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && lotoChecklist.length > 0) {
      setChecklistResponses(lotoChecklist.map(step => ({ step, checked: false })));
    }
  }, [isOpen, lotoChecklist]);

  const allChecked = checklistResponses.length > 0 && checklistResponses.every(r => r.checked);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allChecked) {
      toast.error('You must verify all safety steps before proceeding.');
      return;
    }
    if (!file) {
      toast.error('You must upload a photo of the physical padlock to prove LOTO compliance.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Upload photo
      const attachments = await requestService.uploadAttachments(requestRecord.id || requestRecord._id || '', [file]);
      const proofImageUrl = attachments[0].fileUrl;

      // Submit LOTO form
      const res = await api.post(`/requests/${requestRecord.id || requestRecord._id}/loto`, {
        checklistResponses,
        proofImageUrl
      });

      toast.success('Safety Audit completed successfully.');
      onSuccess();
    } catch (error: any) {
      toast.error('Failed to submit Safety Audit: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Safety Audit: Lockout/Tagout (LOTO)"
      size="md"
    >
      <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-900/50 mb-6">
        <div className="flex items-start">
          <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-red-900 dark:text-red-400">CRITICAL SAFETY STOP</h4>
            <p className="text-sm text-red-800 dark:text-red-300 mt-1">
              The equipment <strong>{equipment?.name}</strong> requires mandatory Lockout/Tagout procedures before maintenance can begin. Falsifying this audit is grounds for immediate termination.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 text-indigo-500" />
            1. Verify Safety Steps
          </h5>
          <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            {checklistResponses.map((item, idx) => (
              <label key={idx} className="flex items-start cursor-pointer group">
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    type="checkbox"
                    required
                    checked={item.checked}
                    onChange={(e) => {
                      const newRes = [...checklistResponses];
                      newRes[idx].checked = e.target.checked;
                      setChecklistResponses(newRes);
                    }}
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <span className={`ml-3 text-sm transition-colors ${item.checked ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
                  {item.step}
                </span>
              </label>
            ))}
            {checklistResponses.length === 0 && (
              <p className="text-sm text-gray-500 italic flex items-center">
                <Info className="h-4 w-4 mr-1" /> No specific steps defined for this equipment. Check the box to proceed.
              </p>
            )}
          </div>
        </div>

        <div>
          <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <Upload className="h-5 w-5 mr-2 text-indigo-500" />
            2. Upload Proof
          </h5>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Upload a clear photo of the physical padlock securing the power switch.
            </p>
            <input
              type="file"
              accept="image/*"
              required
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                dark:file:bg-indigo-900/30 dark:file:text-indigo-400
                hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel Move
          </Button>
          <Button 
            type="submit" 
            disabled={!allChecked || !file || isSubmitting}
            className={!allChecked || !file ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</>
            ) : (
              'Submit Audit & Start Work'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LOTOModal;
