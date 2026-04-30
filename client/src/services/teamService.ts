import api from './api';
import { MaintenanceTeam, TeamMember } from '../types';
import toast from 'react-hot-toast';

export const teamService = {
  getAllTeams: async (): Promise<MaintenanceTeam[]> => {
    const response = await api.get('/teams');
    return response.data;
  },

  getTeamById: async (id: string): Promise<MaintenanceTeam> => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  createTeam: async (data: Partial<MaintenanceTeam>): Promise<MaintenanceTeam> => {
    const response = await api.post('/teams', data);

    toast.success('Team created successfully');

    return response.data;
  },

  updateTeam: async (id: string, data: Partial<MaintenanceTeam>): Promise<MaintenanceTeam> => {
    const response = await api.put(`/teams/${id}`, data);

    toast.success('Team updated successfully');

    return response.data;
  },

  deleteTeam: async (id: string): Promise<void> => {
    await api.delete(`/teams/${id}`);

    toast.success('Team deleted successfully');
  },

  getAllMembers: async (): Promise<TeamMember[]> => {
    const response = await api.get('/members');
    return response.data;
  },

  createMember: async (data: Partial<TeamMember>): Promise<TeamMember> => {
    const response = await api.post('/members', data);

    toast.success('Member created successfully');

    return response.data;
  },

  updateMember: async (id: string, data: Partial<TeamMember>): Promise<TeamMember> => {
    const response = await api.put(`/members/${id}`, data);

    toast.success('Member updated successfully');

    return response.data;
  },

  deleteMember: async (id: string): Promise<void> => {
    await api.delete(`/members/${id}`);

    toast.success('Member deleted successfully');
  },
};