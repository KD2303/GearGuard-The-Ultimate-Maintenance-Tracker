import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { MaintenanceRequest } from '../types';
import { ShieldAlert, CheckCircle2, Upload, Loader2, Info, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { requestService } from '../services/requestService';
import { calculateHaversineDistance } from '../utils/geoUtils';

interface LOTOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestRecord: MaintenanceRequest;
  mode?: 'apply' | 'remove';
}

const LOTOModal: React.FC<LOTOModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  requestRecord,
  mode = 'apply'
}) => {
  const equipment = requestRecord.equipment;
  const lotoChecklist = equipment?.lotoChecklist || [];
  
  const [checklistResponses, setChecklistResponses] = useState<{ step: string; checked: boolean }[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Geolocation states for removal mode
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string>('');
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && lotoChecklist.length > 0 && mode === 'apply') {
      setChecklistResponses(lotoChecklist.map(step => ({ step, checked: false })));
    }

    if (isOpen && mode === 'remove') {
      verifyLocation();
    }
  }, [isOpen, lotoChecklist, mode]);

  const verifyLocation = () => {
    setGeoError('');
    setDistance(null);
    setIsLocating(true);

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser. Please verify you are at the machine to proceed.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        const equipCoords = equipment?.geoLocation?.coordinates;

        // Ensure equipment has coordinates [longitude, latitude]
        if (equipCoords && equipCoords.length === 2 && equipCoords[0] !== 0 && equipCoords[1] !== 0) {
          const equipLon = equipCoords[0];
          const equipLat = equipCoords[1];
          const dist = calculateHaversineDistance(latitude, longitude, equipLat, equipLon);
          setDistance(dist);
          if (dist > 10) {
            setGeoError(`Safety Violation: You are ${Math.round(dist)} meters away. You must be physically present (< 10m) to remove LOTO.`);
          }
        } else {
          // If no equipment coordinates are set, we just skip blocking
          setGeoError('Equipment GPS coordinates not found. Please visually verify you are at the machine.');
        }
      },
      (err) => {
        setIsLocating(false);
        setGeoError(`Location access denied or failed (${err.message}). Bypassing safety check... please verify visually.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const allChecked = checklistResponses.length > 0 && checklistResponses.every(r => r.checked);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'apply') {
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
        const attachments = await requestService.uploadAttachments(requestRecord.id || requestRecord._id || '', [file]);
        const proofImageUrl = attachments[0].fileUrl;
        await api.post(`/requests/${requestRecord.id || requestRecord._id}/loto`, {
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
    } else {
      // Remove Mode
      if (distance !== null && distance > 10) {
         toast.error('Cannot remove LOTO. You are not physically present.');
         return;
      }
      try {
        setIsSubmitting(true);
        await api.post(`/requests/${requestRecord.id || requestRecord._id}/remove-loto`);
        toast.success('LOTO removed successfully.');
        onSuccess();
      } catch (error: any) {
        toast.error('Failed to remove LOTO: ' + (error.response?.data?.error || error.message));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  if (mode === 'remove') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Remove Lockout/Tagout (LOTO)"
        size="md"
      >
        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-900/50 mb-6">
          <div className="flex items-start">
            <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-red-900 dark:text-red-400">CRITICAL SAFETY STOP</h4>
              <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                You are about to digitally unlock this equipment. <strong>You must be physically present at the machine</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg mb-6">
          <h5 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-indigo-500" />
            GPS Safety Geofence
          </h5>
          {isLocating ? (
            <div className="flex items-center text-gray-500 py-2">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Acquiring GPS coordinates...
            </div>
          ) : geoError && distance && distance > 10 ? (
            <div className="text-red-600 dark:text-red-400 font-medium text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {geoError}
            </div>
          ) : geoError ? (
            <div className="text-yellow-600 dark:text-yellow-400 font-medium text-sm p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              {geoError}
            </div>
          ) : distance !== null && distance <= 10 ? (
            <div className="text-green-600 dark:text-green-400 font-medium text-sm p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Location verified! Distance: {Math.round(distance)} meters.
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || (distance !== null && distance > 10) || isLocating}
            className={(distance !== null && distance > 10) || isLocating ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Unlocking...</>
            ) : (
              'Confirm LOTO Removal'
            )}
          </Button>
        </div>
      </Modal>
    );
  }

  // APPLY MODE
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
