import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { CreateMaintenanceRequestDto, Equipment, MaintenanceTeam, TeamMember } from '../types';
import { requestService } from '../services/requestService';
import { equipmentService } from '../services/equipmentService';
import { teamService } from '../services/teamService';
import { uploadService } from '../services/uploadService';
interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: Date | string;
  initialType?: 'corrective' | 'preventive';
}

const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialType = 'corrective',
}) => {
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
  });

  const [autoFilled, setAutoFilled] = useState({
    category: '',
    maintenanceTeam: '',
    maintenanceTeamId: '',
  });

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [teams, setTeams] = useState<MaintenanceTeam[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  // Attachments state
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [equipmentData, teamsData, membersData] =
          await Promise.all([
            equipmentService.getAll(),
            teamService.getAllTeams(),
            teamService.getAllMembers(),
          ]);

        setEquipment(equipmentData);
        setTeams(teamsData);
        setMembers(membersData);
      } catch (error) {
        console.error('Failed to load modal data:', error);
      }
    };

    loadData();
  }, []);

  // Update scheduled date when modal opens with new initialDate
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        scheduledDate: formatDateForInput(initialDate)
      }));
    }
  }, [isOpen, initialDate]);

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
      // FUTURE:
      // Upload attachments here

      let uploadedAttachments = [];

if (attachments.length > 0) {
  uploadedAttachments =
    await uploadService.uploadAttachments(
      attachments
    );
}

await requestService.create({
  ...formData,
  attachments: uploadedAttachments,
});

      onSuccess();
    } catch (error) {
      console.error(
        'Failed to create request:',
        error
      );

      alert('Failed to create request');
    } finally {
      setLoading(false);
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
      title="Create Maintenance Request"
      size="lg"
    >
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
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attachments
          </label>

          <input
            type="file"
            multiple
            accept=".png,.jpg,.jpeg,.pdf"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />

          <p className="text-xs text-gray-500 mt-1">
            Upload up to 5
            images/PDFs (max 5MB
            each)
          </p>

          {attachments.length >
            0 && (
            <div className="mt-3 space-y-2">
              {attachments.map(
                (file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-md"
                  >
                    <span className="text-sm truncate text-gray-900 dark:text-white">
                      {file.name}
                    </span>

                    <span className="text-xs text-gray-500">
                      {(
                        file.size /
                        1024
                      ).toFixed(1)}{' '}
                      KB
                    </span>
                  </div>
                )
              )}
            </div>
          )}
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
              ? 'Creating...'
              : 'Create Request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RequestModal;