import React, { useState, useEffect } from 'react';
import { ShiftHandover, MaintenanceRequest } from '../types';
import { shiftHandoverService } from '../services/shiftHandoverService';
import { requestService } from '../services/requestService';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Plus, CheckCircle, Clock, AlertTriangle, FileText, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

const ShiftHandoverLogbook: React.FC = () => {
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  
  // Form State
  const [shiftType, setShiftType] = useState<'Morning' | 'Afternoon' | 'Night'>('Morning');
  const [notes, setNotes] = useState('');
  const [safetyWarnings, setSafetyWarnings] = useState('');
  
  const [openRequests, setOpenRequests] = useState<MaintenanceRequest[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  useEffect(() => {
    loadData();
    loadOpenRequests();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await shiftHandoverService.getAll();
      setHandovers(data);
    } catch (error) {
      toast.error('Failed to load shift handovers');
    } finally {
      setLoading(false);
    }
  };

  const loadOpenRequests = async () => {
    try {
      const data = await requestService.getAll();
      const open = data.filter(r => r.stage !== 'repaired' && r.stage !== 'scrap');
      setOpenRequests(open);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newHandover = await shiftHandoverService.create({
        shiftType,
        notes,
        safetyWarnings,
        ongoingRepairs: selectedRequests as any
      });
      setHandovers([newHandover, ...handovers]);
      setIsModalOpen(false);
      setNotes('');
      setSafetyWarnings('');
      setSelectedRequests([]);
      toast.success('Shift handover submitted successfully');
    } catch (error) {
      toast.error('Failed to submit handover');
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      const updated = await shiftHandoverService.acknowledge(id);
      setHandovers(handovers.map(h => h._id === id ? updated : h));
      toast.success('Handover acknowledged');
    } catch (error) {
      toast.error('Failed to acknowledge handover');
    }
  };

  if (loading) return <Spinner size="lg" label="Loading logbook..." centered />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" />
            Shift Handover Logbook
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review safety warnings, ongoing repairs, and critical notes from previous shifts.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Handover Log
        </button>
      </div>

      <div className="space-y-6">
        {handovers.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No Handovers Yet</h3>
            <p className="text-slate-500 dark:text-slate-400">Start by creating the first shift handover log.</p>
          </div>
        ) : (
          handovers.map(handover => {
            const hasAcknowledged = handover.acknowledgedBy.some(a => a._id === user?.id);
            const isOwnLog = handover.submittedBy._id === user?.id;

            return (
              <div key={handover._id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {handover.shiftType} Shift
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {format(new Date(handover.shiftDate), 'PPP')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Submitted by <span className="font-semibold text-slate-700 dark:text-slate-300">{handover.submittedBy.name}</span> at {format(new Date(handover.createdAt), 'p')}
                    </p>
                  </div>
                  
                  {!isOwnLog && !hasAcknowledged && (
                    <button
                      onClick={() => handleAcknowledge(handover._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm font-semibold transition-colors text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Acknowledge
                    </button>
                  )}
                  {hasAcknowledged && (
                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle className="w-4 h-4" />
                      Acknowledged
                    </div>
                  )}
                </div>

                <div className="space-y-4 mt-6">
                  {handover.safetyWarnings && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg p-4">
                      <h4 className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-400 mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        Safety Warnings & Hazards
                      </h4>
                      <p className="text-amber-700 dark:text-amber-300 text-sm whitespace-pre-wrap">
                        {handover.safetyWarnings}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Shift Notes</h4>
                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {handover.notes}
                    </div>
                  </div>

                  {handover.ongoingRepairs && handover.ongoingRepairs.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-indigo-500" />
                        Ongoing Repairs Passed On
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {handover.ongoingRepairs.map(repair => (
                          <div key={repair._id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm flex flex-col gap-1 shadow-sm">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{repair.requestNumber}</span>
                            <span className="text-slate-600 dark:text-slate-400 truncate">{repair.subject}</span>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-500">{repair.equipment?.name || 'Unknown'}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {repair.stage}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {handover.acknowledgedBy.length > 0 && (
                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700/50">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Acknowledged by: {handover.acknowledgedBy.map(a => a.name).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Handover Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Submit Shift Handover</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="handover-form" onSubmit={handleSubmit} className="space-y-5">
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Shift Type *</label>
                  <select 
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value as any)}
                    className="w-full rounded-xl border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    <option value="Morning">Morning Shift</option>
                    <option value="Afternoon">Afternoon Shift</option>
                    <option value="Night">Night Shift</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Safety Warnings & Hazards</label>
                  <textarea 
                    value={safetyWarnings}
                    onChange={(e) => setSafetyWarnings(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/10 text-slate-900 dark:text-white shadow-sm focus:border-amber-500 focus:ring-amber-500 placeholder-amber-400/50"
                    placeholder="List any lockout/tagouts, spills, or safety hazards..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Shift Notes *</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Summarize the shift's activities, issues, and pending tasks..."
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Ongoing Repairs Passed On</label>
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2">
                    {openRequests.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">No open tickets to pass on.</p>
                    ) : (
                      openRequests.map(req => (
                        <label key={req._id} className="flex items-start gap-3 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                          <input 
                            type="checkbox"
                            className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
                            checked={selectedRequests.includes(req._id!)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedRequests([...selectedRequests, req._id!]);
                              else setSelectedRequests(selectedRequests.filter(id => id !== req._id));
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{req.requestNumber}: {req.subject}</p>
                            <p className="text-xs text-slate-500">{typeof req.equipment === 'object' ? req.equipment?.name : 'Equipment'}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="handover-form"
                className="px-6 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-colors"
              >
                Submit Handover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftHandoverLogbook;
