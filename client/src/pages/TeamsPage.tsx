import React, { useState, useEffect } from 'react';
import { MaintenanceTeam } from '../types';
import { teamService } from '../services/teamService';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { Plus, Users } from 'lucide-react';
import TeamModal from '../components/TeamModal';
import MemberModal from '../components/MemberModal';
import AssignmentsPanel from '../components/AssignmentsPanel';

const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<MaintenanceTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const loadTeams = async () => {
    try {
      const data = await teamService.getAllTeams();
      setTeams(data);
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading teams...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Maintenance Teams</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Manage teams, members, and assignments</p>
        </div>
        <Button onClick={() => setIsTeamModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Team
        </Button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Teams List - 2 columns */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Teams</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map((team) => (
          <div key={team.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{team.name}</h3>
                {team.specialization && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{team.specialization}</p>
                )}
              </div>
              <Badge variant={team.isActive ? 'success' : 'default'}>
                {team.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {team.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{team.description}</p>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200">
                  <Users className="h-4 w-4 mr-2" />
                  Team Members ({team.members?.length || 0})
                </div>
                <button
                  onClick={() => {
                    setSelectedTeamId(team.id);
                    setIsMemberModalOpen(true);
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Add Member
                </button>
              </div>

              {team.members && team.members.length > 0 ? (
                <div className="space-y-2">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                        {member.role && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{member.role}</p>
                        )}
                      </div>
                      <Badge variant={member.isActive ? 'success' : 'default'} size="sm">
                        {member.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 ">No members yet</p>
              )}
            </div>
          </div>
        ))}
      </div>
      </div>

        {/* Assignments Panel - 1 column */}
        <div className="lg:col-span-1">
          <AssignmentsPanel />
        </div>
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 transition-colors rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">No teams found. Create your first team to get started.</p>
        </div>
      )}

      {isTeamModalOpen && (
        <TeamModal
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
          onSuccess={() => {
            setIsTeamModalOpen(false);
            loadTeams();
          }}
        />
      )}

      {isMemberModalOpen && (
        <MemberModal
          isOpen={isMemberModalOpen}
          onClose={() => {
            setIsMemberModalOpen(false);
            setSelectedTeamId(null);
          }}
          onSuccess={() => {
            setIsMemberModalOpen(false);
            setSelectedTeamId(null);
            loadTeams();
          }}
          defaultTeamId={selectedTeamId || undefined}
        />
      )}
    </div>
  );
};

export default TeamsPage;
