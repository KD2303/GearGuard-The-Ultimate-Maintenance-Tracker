import { useState, useEffect } from 'react';
import { TeamMember } from '../types';
import { teamService } from '../services/teamService';
import { Calendar, User, Mail, Phone, UserCheck } from 'lucide-react';
import Button from './Button';
import Spinner from './Spinner';

const AssignmentsPanel = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await teamService.getAllMembers();
      setMembers(data.filter((m) => m.isActive));
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const daysInMonth = getDaysInMonth(selectedDate);
  const firstDay = getFirstDayOfMonth(selectedDate);
  const today = new Date();

  const prevMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1)
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex justify-center items-center h-[400px]">
        <Spinner size="md" label="Loading assignments..." />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow transition-colors">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Assignments
        </h2>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Team member availability and scheduling
        </p>
      </div>

      <div className="p-6">
        {/* Team Members List */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Team Members
          </h3>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedMember?.id === member.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium dark:text-white truncate">
                        {member.name}
                      </p>

                      <UserCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {member.role || 'Technician'}
                    </p>

                    {member.team && (
                      <p className="text-xs text-gray-400">
                        {member.team.name}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Picker */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Schedule Calendar
          </h3>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                ←
              </button>

              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                {monthNames[selectedDate.getMonth()]}{' '}
                {selectedDate.getFullYear()}
              </h4>

              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                →
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                (day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-2"
                  >
                    {day}
                  </div>
                )
              )}

              {Array.from({ length: firstDay }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-square"
                ></div>
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;

                const isToday =
                  day === today.getDate() &&
                  selectedDate.getMonth() === today.getMonth() &&
                  selectedDate.getFullYear() === today.getFullYear();

                const isPast =
                  new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    day
                  ) < today;

                return (
                  <button
                    key={day}
                    className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${
                      isToday
                        ? 'bg-blue-600 text-white font-bold'
                        : isPast
                        ? 'text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                        : 'text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Selected Info */}
            {selectedMember && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Selected Member:
                    </span>

                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {selectedMember.name}
                    </span>
                  </div>

                  {selectedMember.email && (
                    <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300">
                      <Mail className="w-3 h-3" />

                      <span>{selectedMember.email}</span>
                    </div>
                  )}

                  {selectedMember.phone && (
                    <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300">
                      <Phone className="w-3 h-3" />

                      <span>{selectedMember.phone}</span>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full mt-2"
                  >
                    <Calendar className="w-3 h-3 mr-2" />
                    Assign to Task
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="text-xs text-blue-600 font-medium">
              Available Today
            </div>

            <div className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">
              {members.length}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="text-xs text-green-600 font-medium">
              On Assignment
            </div>

            <div className="text-2xl font-bold text-green-900 dark:text-green-300 mt-1">
              {Math.floor(members.length * 0.6)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentsPanel;