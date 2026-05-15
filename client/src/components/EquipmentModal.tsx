import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { CreateEquipmentDto, MaintenanceTeam, TeamMember } from '../types';
import { equipmentService } from '../services/equipmentService';
import { teamService } from '../services/teamService';
import { Car } from 'lucide-react';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EquipmentModal: React.FC<EquipmentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateEquipmentDto>({
    name: '',
    serialNumber: '',
    category: '',
    department: '',
    assignedTo: '',
    location: '',
    purchaseDate: '',
    warrantyExpiry: '',
    manufacturer: '',
    model: '',
    notes: '',
    maintenanceTeamId: '',
    defaultTechnicianId: '',
    licensePlate: '',
    currentMileage: 0,
    fuelType: '',
  });
  
  const [teams, setTeams] = useState<MaintenanceTeam[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');

  const handleClose = () => {
    setSubmitError('');
    setIsSubmitting(false);
    onClose();
  };

  useEffect(() => {
    const loadData = async () => {
      const [teamsData, membersData] = await Promise.all([
        teamService.getAllTeams(),
        teamService.getAllMembers(),
      ]);
      setTeams(teamsData);
      setMembers(membersData);
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    // Frontend validation before sending to server
    if (!formData.name?.trim()) {
      setSubmitError('Equipment name is required.');
      return;
    }
    if (!formData.serialNumber?.trim()) {
      setSubmitError('Serial number is required.');
      return;
    }
    if (!formData.category) {
      setSubmitError('Category is required.');
      return;
    }
    if (!formData.location?.trim()) {
      setSubmitError('Location is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Clean the payload — convert empty strings to undefined
      const payload = {
        ...formData,
        name: formData.name.trim(),
        serialNumber: formData.serialNumber.trim(),
        location: formData.location.trim(),
        department: formData.department?.trim() || undefined,
        maintenanceTeamId: formData.maintenanceTeamId || undefined,
        defaultTechnicianId: formData.defaultTechnicianId || undefined,
        purchaseDate: formData.purchaseDate || undefined,
        warrantyExpiry: formData.warrantyExpiry || undefined,
        notes: formData.notes?.trim() || undefined,
      };

      await equipmentService.create(payload);

      setSubmitError('');
      onSuccess();
      handleClose();
    } catch (error: any) {
      // Show the server's error message if available
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to create equipment. Please check all fields and try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Equipment" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Equipment Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-dark"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Serial Number *
            </label>
            <input
              type="text"
              required
              value={formData.serialNumber}
              onChange={(e) =>
                setFormData({ ...formData, serialNumber: e.target.value })
              }
              className="input-dark"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-dark"
            >
              <option value="">Select category...</option>
              <option value="Machine">Machine</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Computer">Computer</option>
              <option value="Office">Office</option>
              <option value="Tools">Tools</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Location *
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="input-dark"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Department
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              className="input-dark"
              placeholder="e.g., Production, IT"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Assigned To
            </label>
            <input
              type="text"
              value={formData.assignedTo}
              onChange={(e) =>
                setFormData({ ...formData, assignedTo: e.target.value })
              }
              className="input-dark"
              placeholder="Employee name"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Manufacturer
            </label>
            <input
              type="text"
              value={formData.manufacturer}
              onChange={(e) =>
                setFormData({ ...formData, manufacturer: e.target.value })
              }
              className="input-dark"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Model
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="input-dark"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Purchase Date
            </label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) =>
                setFormData({ ...formData, purchaseDate: e.target.value })
              }
              className="input-dark"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Warranty Expiry
            </label>
            <input
              type="date"
              value={formData.warrantyExpiry}
              onChange={(e) =>
                setFormData({ ...formData, warrantyExpiry: e.target.value })
              }
              className="input-dark"
            />
          </div>
        </div>

        {formData.category.toLowerCase() === 'vehicle' && (
          <div className="bg-orange-50 dark:bg-gray-800 p-4 rounded-xl border border-orange-100 dark:border-gray-700 transition-colors">
            <h4 className="text-sm font-bold text-orange-800 flex items-center">
              <Car className="h-4 w-4 mr-2" />
              Vehicle Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
                  License Plate
                </label>
                <input
                  type="text"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                  placeholder="e.g., ABC-1234"
                  className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500  bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
                  Current Mileage (km)
                </label>
                <input
                  type="number"
                  value={formData.currentMileage}
                  onChange={(e) => setFormData({ ...formData, currentMileage: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
                Fuel Type
              </label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select fuel type...</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="CNG">CNG</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Maintenance Team
          </label>
          <select
            value={formData.maintenanceTeamId}
            onChange={(e) =>
              setFormData({ ...formData, maintenanceTeamId: e.target.value })
            }
            className="input-dark"
          >
            <option value="">Select team...</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Default Technician
          </label>
          <select
            value={formData.defaultTechnicianId}
            onChange={(e) =>
              setFormData({ ...formData, defaultTechnicianId: e.target.value })
            }
            className="input-dark"
          >
            <option value="">Select technician...</option>
            {members
              .filter(
                (m) => !formData.maintenanceTeamId || m.teamId === formData.maintenanceTeamId
              )
              .map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="input-dark"
          />
        </div>

        {submitError && (
          <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 font-medium">{submitError}</p>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Equipment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EquipmentModal;
