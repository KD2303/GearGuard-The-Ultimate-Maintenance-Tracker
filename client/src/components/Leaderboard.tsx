import React, { useState, useEffect } from 'react';
import { TeamMember } from '../types';
import { teamService } from '../services/teamService';
import { Trophy, Zap, Shield, Wrench, Medal } from 'lucide-react';

const Leaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await teamService.getLeaderboard();
        setLeaders(data);
      } catch (error) {
        console.error('Failed to load leaderboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading leaderboard...</div>;
  }

  if (leaders.length === 0) {
    return (
      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/50 rounded-xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-4">
          <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
          Top Technicians
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
          No points awarded yet. Complete tasks to climb the leaderboard!
        </p>
      </div>
    );
  }

  const renderBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'First Responder':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'Zero Downtime':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'Master Mechanic':
        return <Wrench className="w-4 h-4 text-gray-500 dark:text-gray-300" />;
      default:
        return <Medal className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/40 dark:border-gray-700/50 rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-6">
        <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
        Leaderboard
      </h3>
      <div className="space-y-3">
        {leaders.map((member, index) => (
          <div 
            key={member.id} 
            className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-900/50 border border-white/20 dark:border-gray-700/30 shadow-sm hover:bg-white/60 dark:hover:bg-gray-900/70 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-200 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                {index + 1}
              </div>
              {member.avatar ? (
                <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium border border-primary-200 dark:border-primary-800">
                  {member.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{member.name}</p>
                <div className="flex space-x-1 mt-1">
                  {member.badges?.map((badge, idx) => (
                    <div key={idx} title={badge} className="bg-white/50 dark:bg-gray-800/50 rounded-full p-1 border border-white/20 dark:border-gray-700/30">
                      {renderBadgeIcon(badge)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary-600 dark:text-primary-400 leading-none">{member.points || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mt-1">XP</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
