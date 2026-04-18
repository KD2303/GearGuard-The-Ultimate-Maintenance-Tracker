import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { CreateMaintenanceRequestDto } from '../types';
import { requestService } from '../services/requestService';
import { equipmentService } from '../services/equipmentService';
import { teamService } from '../services/teamService';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: Date;
  initialType?: 'corrective' | 'preventive';
}

const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialType = 'corrective',
}) => {
  const [formData, setFormData] = useState<CreateMaintenanceRequestDto>({
    subject: '',
    description: '',
    type: initialType,
    priority: 'medium',
    scheduledDate: initialDate ? initialDate.toISOString().slice(0, 16) : '',
    equipmentId: '',
    teamId: '',
    assignedToId: '',
  });
  
  const [equipment, setEquipment] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [equipmentData, teamsData, membersData] = await Promise.all([
        equipmentService.getAll(),
        teamService.getAllTeams(),
        teamService.getAllMembers(),
      ]);
      setEquipment(equipmentData);
      setTeams(teamsData);
      setMembers(membersData);
    };
    loadData();
  }, []);

 // Auto-fill team and technician when equipment is selected
useEffect(() => {
  if (!formData.equipmentId) return;

  const selectedEquipment = equipment.find(
    (e) => e._id.toString() === formData.equipmentId
  );

  if (!selectedEquipment) return;

  setFormData((prev) => ({
    ...prev,
    teamId: selectedEquipment.maintenanceTeamId?.toString() || '',
    assignedToId: selectedEquipment.defaultTechnicianId?.toString() || '',
  }));
}, [formData.equipmentId, equipment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestService.create(formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create request:', error);
      alert('Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Maintenance Request" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject *
          </label>
          <input
            type="text"
            required
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., Leaking Oil"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Detailed description of the issue..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="corrective">Corrective (Breakdown)</option>
              <option value="preventive">Preventive (Routine)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Equipment
          </label>
          <select
            value={formData.equipmentId}
            onChange={(e) =>
              setFormData({ ...formData, equipmentId: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select equipment...</option>
            {equipment.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name} - {item.serialNumber}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maintenance Team
          </label>
          <select
            value={formData.teamId}
            onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select team...</option>
            {teams.map((team) => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assigned To
          </label>
          <select
            value={formData.assignedToId}
            onChange={(e) =>
              setFormData({ ...formData, assignedToId: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select technician...</option>
            {members
              .map((member) => (
                <option key={member._id} value={member._id.toString()}>
                  {member.name} {member.role && `(${member.role})`}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scheduled Date
          </label>
          <input
            type="datetime-local"
            value={formData.scheduledDate}
            onChange={(e) =>
              setFormData({ ...formData, scheduledDate: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RequestModal;
