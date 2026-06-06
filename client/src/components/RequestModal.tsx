import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { CreateMaintenanceRequestDto, Equipment, MaintenanceTeam, TeamMember, SparePart } from '../types';
import { requestService } from '../services/requestService';
import { equipmentService } from '../services/equipmentService';
import { teamService } from '../services/teamService';
import { inventoryService } from '../services/inventoryService';
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import TicketComments from './TicketComments';
import RequestToolsTab from './RequestToolsTab';
import { MaintenanceRequest } from '../types';
import { ShieldCheck, CheckCircle } from 'lucide-react';
import ImageUploadZone from './ImageUploadZone';
import ImageGallery from './ImageGallery';
interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: Date | string;
  initialType?: 'corrective' | 'preventive';
  initialEquipmentId?: string;
  editRequestId?: string;
}

const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialType = 'corrective',
  initialEquipmentId,
  editRequestId,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'loto'>('details');
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'tools'>('details');
  const [existingRequest, setExistingRequest] = useState<MaintenanceRequest | null>(null);
  // Helper function to format date for datetime-local input
  const formatDateForInput = (dateInput?: Date | string): string => {
    if (!dateInput) return '';
    
    try {
      let date: Date;
      
      // Handle both string and Date object inputs
      if (typeof dateInput === 'string') {
        date = new Date(dateInput);
      } else {
        date = dateInput;
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date provided:', dateInput);
        return '';
      }
      
      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
      
      console.log('Formatted date:', formattedDate);
      return formattedDate;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const [formData, setFormData] = useState<CreateMaintenanceRequestDto>({
    subject: '',
    description: '',
    type: initialType,
    priority: 'medium',
    scheduledDate: formatDateForInput(initialDate),
    equipmentId: '',
    teamId: '',
    assignedToId: '',
    checklist: [],
  });

  const [autoFilled, setAutoFilled] = useState({
    category: '',
    maintenanceTeam: '',
    maintenanceTeamId: '',
  });

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [teams, setTeams] = useState<MaintenanceTeam[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [selectedParts, setSelectedParts] = useState<{ partId: string; quantityUsed: number }[]>([]);
  const [requiredParts, setRequiredParts] = useState<{ partId: string; quantityNeeded: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<SparePart[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  // Attachments state
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [equipmentData, teamsData, membersData, partsData] =
          await Promise.all([
            equipmentService.getAll(),
            teamService.getAllTeams(),
            teamService.getAllMembers(),
            inventoryService.getAll(),
          ]);

        setEquipment(equipmentData);
        setTeams(teamsData);
        setMembers(membersData);
        setSpareParts(partsData);
      } catch (error) {
        console.error('Failed to load modal data:', error);
      }
    };

    loadData();
  }, []);

  // Update scheduled date and pre-selected equipment when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        scheduledDate: formatDateForInput(initialDate),
        equipmentId: initialEquipmentId || prev.equipmentId || '',
      }));
      if (initialEquipmentId) {
        handleEquipmentChange(initialEquipmentId);
      }
    }
  }, [isOpen, initialDate, initialEquipmentId]);

  useEffect(() => {
    if (isOpen && editRequestId) {
      requestService.getById(editRequestId)
        .then(req => {
          setExistingRequest(req);
          // Auto-fill form data for view/edit mode
          setFormData({
            subject: req.subject || '',
            description: req.description || '',
            type: req.type,
            priority: req.priority,
            scheduledDate: formatDateForInput(req.scheduledDate),
            equipmentId: typeof req.equipmentId === 'object' ? (req.equipmentId as any)._id : req.equipmentId || '',
            teamId: typeof req.teamId === 'object' ? (req.teamId as any)._id : req.teamId || '',
            assignedToId: typeof req.assignedToId === 'object' ? (req.assignedToId as any)._id : req.assignedToId || '',
            checklist: req.checklist || [],
          });
        })
        .catch(err => console.error(err));

      setLoadingPredictions(true);
      requestService.getPredictions(editRequestId)
        .then(parts => {
          setPredictions(parts);
          setLoadingPredictions(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingPredictions(false);
        });
    } else if (!isOpen) {
      setExistingRequest(null);
      setActiveTab('details');
      setPredictions([]);
    }
  }, [isOpen, editRequestId]);

  const handleReservePart = async (partId: string) => {
    if (!editRequestId) return;
    try {
      await requestService.reservePart(editRequestId, partId, 1);
      toast.success('Part reserved successfully!');
      setPredictions(prev => prev.map(p => p._id === partId ? { ...p, quantityInStock: p.quantityInStock - 1 } : p));
    } catch (error: any) {
      toast.error('Failed to reserve part: ' + (error.response?.data?.error || error.message));
    }
  };

  // Auto-fill category/team
  const handleEquipmentChange = async (
    equipmentId: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      equipmentId,
    }));

    if (!equipmentId) {
      setAutoFilled({
        category: '',
        maintenanceTeam: '',
        maintenanceTeamId: '',
      });

      return;
    }

    try {
      const eq =
        await equipmentService.getById(
          equipmentId
        );

      const teamObj =
        typeof eq.maintenanceTeamId ===
          'object' &&
        eq.maintenanceTeamId !== null
          ? eq.maintenanceTeamId
          : null;

      const techObj =
        typeof eq.defaultTechnicianId ===
          'object' &&
        eq.defaultTechnicianId !== null
          ? eq.defaultTechnicianId
          : null;

      setAutoFilled({
        category: eq.category || '',
        maintenanceTeam:
          teamObj?.name || '',
        maintenanceTeamId:
          teamObj?._id || '',
      });

      setFormData((prev) => ({
        ...prev,
        teamId:
          teamObj?._id || prev.teamId,
        assignedToId:
          techObj?._id ||
          prev.assignedToId,
      }));
    } catch (error) {
      console.error(
        'Failed to fetch equipment:',
        error
      );
    }
  };

  // File selection
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(
      e.target.files
    );

    // Max 5 files
    if (selectedFiles.length > 5) {
      alert('Maximum 5 files allowed');
      return;
    }

    // Validate size
    const validFiles =
      selectedFiles.filter((file) => {
        if (
          file.size >
          5 * 1024 * 1024
        ) {
          alert(
            `${file.name} exceeds 5MB limit`
          );

          return false;
        }

        return true;
      });

    setAttachments(validFiles);
  };

  const handleSmartAssignInModal = async () => {
    if (!editRequestId) {
      toast.error("Please create the ticket first before using auto-assign.");
      return;
    }
    try {
      setLoading(true);
      const updated = await requestService.smartAssign(editRequestId);
      if (updated) {
        const assignedId = typeof updated.assignedToId === 'object' ? (updated.assignedToId as any)._id : updated.assignedToId;
        setFormData(prev => ({
          ...prev,
          assignedToId: assignedId || ''
        }));
        onSuccess();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to auto-assign";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    // Validate scheduled date if provided
    if (formData.scheduledDate) {
      const selectedDate = new Date(formData.scheduledDate);
      if (isNaN(selectedDate.getTime())) {
        alert('Please enter a valid date and time');
        return;
      }
    }

    setLoading(true);

    try {
      if (editRequestId) {
        await requestService.update(editRequestId, {
          ...formData,
        });

        if (attachments.length > 0) {
          await requestService.uploadAttachments(editRequestId, attachments);
        }
      } else {
        const newRequest = await requestService.create({
          ...formData,
          partsUsed: selectedParts.filter(p => p.partId && p.quantityUsed > 0),
          requiredParts: requiredParts.filter(p => p.partId && p.quantityNeeded > 0),
        });

        if (attachments.length > 0 && newRequest._id) {
          await requestService.uploadAttachments(newRequest._id, attachments);
        }
      }

      onSuccess();
    } catch (error) {
      console.error(
        'Failed to create/update request:',
        error
      );

      alert('Failed to save request');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!editRequestId) return;
    try {
      await requestService.deleteAttachment(editRequestId, attachmentId);
      setExistingRequest(prev => prev ? {
        ...prev,
        attachments: prev.attachments?.filter(a => (a as any)._id !== attachmentId)
      } : prev);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as CreateMaintenanceRequestDto['type'];
    setFormData((prev) => ({ ...prev, type: value }));
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as NonNullable<CreateMaintenanceRequestDto['priority']>;
    setFormData((prev) => ({ ...prev, priority: value }));
  };

  const handleClose = () => {
    setAttachments([]);
    setSelectedParts([]);
    setRequiredParts([]);

    setAutoFilled({
      category: '',
      maintenanceTeam: '',
      maintenanceTeamId: '',
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editRequestId ? `Request ${existingRequest?.requestNumber || ''}` : "Create Maintenance Request"}
      size="lg"
    >
      {editRequestId && (
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            type="button"
            className={`py-2 px-4 text-sm font-medium border-b-2 ${activeTab === 'details' ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            type="button"
            className={`py-2 px-4 text-sm font-medium border-b-2 ${activeTab === 'comments' ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            onClick={() => setActiveTab('comments')}
          >
            Comments
          </button>
          
          {existingRequest?.equipment?.lotoRequired && (
            <button
              type="button"
              className={`py-2 px-4 text-sm font-medium border-b-2 ${activeTab === 'loto' ? 'border-red-500 text-red-600 dark:text-red-400 dark:border-red-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'} flex items-center`}
              onClick={() => setActiveTab('loto')}
            >
              <ShieldCheck className="h-4 w-4 mr-1.5" />
              Safety Audit
              {existingRequest.lotoAudit?.isCompleted && (
                <CheckCircle className="h-3 w-3 ml-1.5 text-green-500" />
              )}
            </button>
          )}
          <button
            type="button"
            className={`py-2 px-4 text-sm font-medium border-b-2 ${activeTab === 'tools' ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            onClick={() => setActiveTab('tools')}
          >
            Tools
            {existingRequest?.checkedOutTools && existingRequest.checkedOutTools.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-full text-xs">
                {existingRequest.checkedOutTools.length}
              </span>
            )}
          </button>
        </div>
      )}

      {activeTab === 'details' && (
      <div className="space-y-6">
        {editRequestId && (predictions.length > 0 || loadingPredictions) && (
          <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-900 rounded-xl">
            <h3 className="flex items-center text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">
              <Sparkles className="w-4 h-4 mr-1.5 text-blue-500" />
              AI Recommended Parts
            </h3>
            {loadingPredictions ? (
              <div className="flex justify-center py-2"><Loader2 className="w-5 h-5 animate-spin text-blue-400" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {predictions.map(part => (
                  <div key={part._id} className="p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-blue-100/50 dark:border-blue-800/50 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{part.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Stock: {part.quantityInStock}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReservePart(part._id!)}
                      disabled={part.quantityInStock <= 0}
                      className="mt-2 w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-[10px] font-medium rounded-md transition-colors"
                    >
                      {part.quantityInStock <= 0 ? 'Out of Stock' : 'Reserve Part'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject *
          </label>

          <input
            type="text"
            required
            value={formData.subject}
            onChange={(e) =>
              setFormData({
                ...formData,
                subject: e.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g. Leaking oil"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>

          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData({
                ...formData,
                description:
                  e.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Describe the issue..."
          />
        </div>

        {/* Checklist */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Checklist (Sub-tasks)
          </label>
          <div className="space-y-2">
            {(formData.checklist || []).map((item, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/40 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                <input
                  type="checkbox"
                  checked={item.isCompleted}
                  onChange={(e) => {
                    const newChecklist = [...(formData.checklist || [])];
                    newChecklist[index].isCompleted = e.target.checked;
                    setFormData({ ...formData, checklist: newChecklist });
                  }}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => {
                    const newChecklist = [...(formData.checklist || [])];
                    newChecklist[index].text = e.target.value;
                    setFormData({ ...formData, checklist: newChecklist });
                  }}
                  className={`flex-1 bg-transparent border-none focus:ring-0 text-sm ${item.isCompleted ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}
                  placeholder="Task description..."
                />
                <button
                  type="button"
                  onClick={() => {
                    const newChecklist = (formData.checklist || []).filter((_, i) => i !== index);
                    setFormData({ ...formData, checklist: newChecklist });
                  }}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, checklist: [...(formData.checklist || []), { text: '', isCompleted: false }] })}
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 mt-2"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Sub-task
            </button>
          </div>
        </div>

        {/* Type + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>

            <select
              required
              value={formData.type}
              onChange={handleTypeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="corrective">
                Corrective
              </option>

              <option value="preventive">
                Preventive
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>

            <select
              value={formData.priority}
              onChange={handlePriorityChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="low">
                Low
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="high">
                High
              </option>

              <option value="urgent">
                Urgent
              </option>
            </select>
          </div>
        </div>

        {/* Equipment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Equipment
          </label>

          <select
            value={formData.equipmentId}
            onChange={(e) =>
              handleEquipmentChange(
                e.target.value
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select equipment...</option>
            {equipment.map((item) => {
              const equipmentId = item._id ?? item.id;
              return (
                <option key={equipmentId} value={equipmentId}>
                  {item.name} - {item.serialNumber}
                </option>
              );
            })}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category (auto-filled)
          </label>

          <input
            type="text"
            readOnly
            value={autoFilled.category}
            placeholder="Select equipment to auto-fill"
            className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"
          />
        </div>

        {/* Auto Team */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maintenance Team
            (auto-filled)
          </label>

          <input
            type="text"
            readOnly
            value={
              autoFilled.maintenanceTeam
            }
            placeholder="Select equipment to auto-fill"
            className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"
          />
        </div>

        {/* Team */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maintenance Team
          </label>

          <select
            value={formData.teamId}
            onChange={(e) =>
              setFormData({
                ...formData,
                teamId:
                  e.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select team...</option>
            {teams.map((team) => {
              const teamId = team._id ?? team.id;
              return (
                <option key={teamId} value={teamId}>
                  {team.name}
                </option>
              );
            })}
          </select>
        </div>

        {/* Assigned */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assigned To
          </label>

          <select
            value={formData.assignedToId}
            onChange={(e) =>
              setFormData({
                ...formData,
                assignedToId:
                  e.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select technician...</option>
            {members.map((member) => {
              const memberId = member._id ?? member.id;
              return (
                <option key={memberId} value={String(memberId)}>
                  {member.name} {member.role && `(${member.role})`}
                </option>
              );
            })}
          </select>

          {!formData.assignedToId && editRequestId && (
            <button
              type="button"
              onClick={handleSmartAssignInModal}
              className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 hover:from-violet-500/20 hover:to-indigo-500/20 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 rounded-lg text-xs font-semibold border border-violet-200/50 dark:border-violet-800/30 transition-all duration-200 shadow-sm shadow-violet-500/5"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              Smart Auto-Assign
            </button>
          )}
        </div>

        {/* Spare Parts Used */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">

        {/* Required Parts (BOM Kit) - Only show when creating */}
        {!editRequestId && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
              Required Parts (Advance Kit Reservation)
            </label>
            <p className="text-xs text-slate-500 mb-3">Parts selected here will be automatically reserved from inventory upon creation.</p>
            <div className="space-y-3">
              {requiredParts.map((item, index) => (
                <div key={index} className="flex gap-3 items-center bg-teal-50 dark:bg-teal-900/20 p-3 rounded-xl border border-teal-100 dark:border-teal-800/30">
                  <select
                    value={item.partId}
                    onChange={(e) => {
                      const newParts = [...requiredParts];
                      newParts[index].partId = e.target.value;
                      setRequiredParts(newParts);
                    }}
                    className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-950 dark:text-white focus:outline-none"
                  >
                    <option value="">Select a spare part...</option>
                    {spareParts.map((part) => (
                      <option key={part._id || part.id} value={part._id || part.id}>
                        {part.name} (Stock: {part.quantityInStock})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantityNeeded || ""}
                    onChange={(e) => {
                      const newParts = [...requiredParts];
                      newParts[index].quantityNeeded = parseInt(e.target.value) || 0;
                      setRequiredParts(newParts);
                    }}
                    className="w-20 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-950 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setRequiredParts(requiredParts.filter((_, i) => i !== index))}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setRequiredParts([...requiredParts, { partId: "", quantityNeeded: 1 }])}
                className="flex items-center text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 gap-1 mt-1"
              >
                <Plus className="h-4 w-4" />
                Add Required Part to Kit
              </button>
            </div>
          </div>
        )}
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
            Spare Parts Used
          </label>
          <div className="space-y-3">
            {selectedParts.map((item, index) => (
              <div key={index} className="flex gap-3 items-center bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                {/* Part Dropdown */}
                <select
                  value={item.partId}
                  onChange={(e) => {
                    const newParts = [...selectedParts];
                    newParts[index].partId = e.target.value;
                    setSelectedParts(newParts);
                  }}
                  className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-950 dark:text-white focus:outline-none"
                >
                  <option value="">Select a spare part...</option>
                  {spareParts.map((part) => (
                    <option key={part._id || part.id} value={part._id || part.id}>
                      {part.name} (Stock: {part.quantityInStock})
                    </option>
                  ))}
                </select>

                {/* Quantity Input */}
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={item.quantityUsed || ""}
                  onChange={(e) => {
                    const newParts = [...selectedParts];
                    newParts[index].quantityUsed = parseInt(e.target.value) || 0;
                    setSelectedParts(newParts);
                  }}
                  className="w-20 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-950 dark:text-white focus:outline-none"
                />

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedParts(selectedParts.filter((_, i) => i !== index));
                  }}
                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setSelectedParts([...selectedParts, { partId: "", quantityUsed: 1 }])}
              className="flex items-center text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 gap-1 mt-1"
            >
              <Plus className="h-4 w-4" />
              Add Spare Part Used
            </button>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
            Attachments
          </label>

          {existingRequest?.attachments && existingRequest.attachments.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
              <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Existing Attachments</h4>
              <ImageGallery 
                attachments={existingRequest.attachments} 
                onDelete={handleDeleteAttachment} 
              />
            </div>
          )}

          <div className="mt-2">
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              Upload New Attachments
            </h4>
            <ImageUploadZone 
              files={attachments} 
              onChange={setAttachments} 
              maxFiles={5} 
              maxSizeMB={5} 
            />
          </div>
        </div>

        {/* Scheduled Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scheduled Date
          </label>

          <input
            type="datetime-local"
            value={formData.scheduledDate || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                scheduledDate:
                  e.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {formData.scheduledDate && (
            <p className="text-xs text-gray-500 mt-1">
              Selected: {new Date(formData.scheduledDate).toLocaleString()}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Saving...'
              : (editRequestId ? 'Save Changes' : 'Create Request')}
          </Button>
        </div>
      </form>
      </div>
      )}

      {activeTab === 'comments' && existingRequest && (
        <TicketComments request={existingRequest} currentUser={user} />
      )}

      {activeTab === 'loto' && existingRequest && (
        <div className="space-y-6">
          {!existingRequest.lotoAudit?.isCompleted ? (
            <div className="p-6 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/50 rounded-xl text-center">
              <ShieldCheck className="h-12 w-12 text-yellow-500 mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-400 mb-2">Safety Audit Pending</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                This equipment requires a mandatory Lockout/Tagout (LOTO) procedure. The audit will be prompted when moving the ticket to "In Progress".
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-900/50 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-green-50 dark:bg-green-900/20 px-4 py-3 border-b border-green-200 dark:border-green-900/50 flex justify-between items-center">
                <h3 className="font-bold text-green-800 dark:text-green-400 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  LOTO Safety Audit Completed
                </h3>
                <span className="text-xs font-medium text-green-700 dark:text-green-500">
                  {new Date(existingRequest.lotoAudit.completedAt!).toLocaleString()}
                </span>
              </div>
              
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Checklist Steps Verified</h4>
                  <ul className="space-y-2">
                    {existingRequest.lotoAudit.checklistResponses?.map((resp, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        {resp.step}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {existingRequest.lotoAudit.proofImageUrl && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Proof of Lockout</h4>
                    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 aspect-video relative flex items-center justify-center">
                      <img 
                        src={existingRequest.lotoAudit.proofImageUrl.startsWith('http') ? existingRequest.lotoAudit.proofImageUrl : `http://localhost:5000${existingRequest.lotoAudit.proofImageUrl}`} 
                        alt="LOTO Proof" 
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      {activeTab === 'tools' && existingRequest && (
        <RequestToolsTab 
          requestRecord={existingRequest} 
          onUpdate={() => {
            // refresh data
            requestService.getById(existingRequest._id || existingRequest.id)
              .then(req => {
                setExistingRequest(req);
                onSuccess(); // bubble up
              })
              .catch(console.error);
          }} 
        />
      )}
    </Modal>
  );
};

export default RequestModal;