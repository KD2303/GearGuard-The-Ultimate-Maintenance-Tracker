import React, { useState } from 'react';
import { MaintenanceRequest } from '../types';
import { requestService } from '../services/requestService';
import { X, Send, Mail, Building, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EscalateModalProps {
  request: MaintenanceRequest;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedRequest: MaintenanceRequest) => void;
}

const EscalateModal: React.FC<EscalateModalProps> = ({ request, isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorCompany, setVendorCompany] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorEmail || !vendorCompany) return;

    setIsSubmitting(true);
    try {
      const updated = await requestService.escalateToVendor(request._id || request.id, {
        vendorEmail,
        vendorCompany,
        message,
      });
      onSuccess(updated);
    } catch (error) {
      console.error('Escalation failed', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-slide-up">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Send className="w-5 h-5" />
            Escalate to Vendor
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            An automated email containing the equipment details (Serial: <span className="font-semibold">{request.equipment?.serialNumber || 'N/A'}</span>) and fault description will be sent to the vendor.
          </p>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Vendor Company *</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                required
                value={vendorCompany}
                onChange={(e) => setVendorCompany(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Vendor Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="email" 
                required
                value={vendorEmail}
                onChange={(e) => setVendorEmail(e.target.value)}
                placeholder="support@acmecorp.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Additional Message (Optional)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea 
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Include any specific questions or urgency details..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || !vendorEmail || !vendorCompany}
              className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center gap-2 shadow-lg transition-all"
            >
              {isSubmitting ? 'Sending...' : 'Escalate & Send Email'}
              {!isSubmitting && <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EscalateModal;
