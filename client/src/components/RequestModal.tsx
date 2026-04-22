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

  const [autoFilled, setAutoFilled] = useState({
    category: '',
    maintenanceTeam: '',
    maintenanceTeamId: '',
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

  // Auto-fill category and team when equipment is selected
  const handleEquipmentChange = async (equipmentId: string) => {
    setFormData(prev => ({ ...prev, equipmentId }));
    if (!equipmentId) {
      setAutoFilled({ category: '', maintenanceTeam: '', maintenanceTeamId: '' });
      return;
    }
    try {
      const eq = await equipmentService.getById(equipmentId);
      const teamObj = typeof eq.maintenanceTeamId === 'object' && eq.maintenanceTeamId !== null
        ? eq.maintenanceTeamId as { _id: string; name: string; specialization?: string }
        : null;
      const techObj = typeof eq.defaultTechnicianId === 'object' && eq.defaultTechnicianId !== null
        ? eq.defaultTechnicianId as { _id: string; name: string; email?: string; role?: string }
        : null;
      setAutoFilled({
        category: eq.category || '',
        maintenanceTeam: teamObj?.name || '',
        maintenanceTeamId: teamObj?._id || '',
      });
      setFormData(prev => ({
        ...prev,
        teamId: teamObj?._id || prev.teamId,
        assignedToId: techObj?._id || prev.assignedToId,
      }));
    } catch (error) {
      console.error('Failed to fetch equipment details:', error);
    }
  };

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

  const handleClose = () => {
    setAutoFilled({ category: '', maintenanceTeam: '', maintenanceTeamId: '' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Maintenance Request" size="lg">
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
            onChange={(e) => handleEquipmentChange(e.target.value)}
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
            Category (auto-filled)
          </label>
          <input
            type="text"
            value={autoFilled.category}
            readOnly
            placeholder="Select equipment to auto-fill"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maintenance Team (auto-filled)
          </label>
          <input
            type="text"
            value={autoFilled.maintenanceTeam}
            readOnly
            placeholder="Select equipment to auto-fill"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
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
          <Button type="button" variant="secondary" onClick={handleClose}>
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
