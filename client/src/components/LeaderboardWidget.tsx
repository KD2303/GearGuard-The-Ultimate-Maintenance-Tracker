import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { Trophy, Medal, Star, ShieldCheck, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LeaderboardEntry {
  technicianId: string;
  technicianName: string;
  technicianEmail: string;
  technicianAvatar?: string;
  totalClosed: number;
  avgResolutionTimeHours: number;
}

const LeaderboardWidget: React.FC = () => {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await adminService.getLeaderboardAnalytics();
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to load leaderboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-400 drop-shadow-md" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-300 drop-shadow-md" />;
      case 2:
        return <Medal className="w-6 h-6 text-amber-600 drop-shadow-md" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-400">#{index + 1}</span>;
    }
  };

  const renderBadges = (entry: LeaderboardEntry) => {
    const badges = [];
    if (entry.totalClosed >= 5) {
      badges.push(
        <div key="speed" className="group relative flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 rounded-full p-1" title="Speed Demon (5+ Closed)">
          <Zap className="w-3 h-3 text-blue-500" />
        </div>
      );
    }
    if (entry.avgResolutionTimeHours < 4 && entry.totalClosed > 0) {
      badges.push(
        <div key="star" className="group relative flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/50 rounded-full p-1" title="Top Performer (Fast Resolution)">
          <Star className="w-3 h-3 text-yellow-500" />
        </div>
      );
    }
    if (badges.length === 0) {
      badges.push(
        <div key="reliable" className="group relative flex items-center justify-center bg-green-100 dark:bg-green-900/50 rounded-full p-1" title="Reliable Technician">
          <ShieldCheck className="w-3 h-3 text-green-500" />
        </div>
      );
    }
    return <div className="flex gap-1">{badges}</div>;
  };

  if (loading) {
    return (
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden animate-pulse">
        <div className="h-16 bg-gradient-to-r from-amber-500 to-orange-600"></div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-amber-200 dark:border-amber-900/30 transition-all hover:shadow-2xl">
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-white" />
          <h3 className="text-xl font-bold text-white tracking-wide">Top Performers</h3>
        </div>
        <span className="text-xs font-medium text-amber-100 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">Last 7 Days</span>
      </div>

      <div className="p-2">
        {leaderboard.length > 0 ? (
          <div className="flex flex-col gap-2">
            {leaderboard.map((entry, idx) => (
              <div key={entry.technicianId} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 hover:shadow-md border border-gray-100 dark:border-gray-700/50 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(idx)}
                  </div>
                  
                  <div className="relative">
                    {entry.technicianAvatar ? (
                      <img src={entry.technicianAvatar} alt={entry.technicianName} className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                        {entry.technicianName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1">
                      {renderBadges(entry)}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{entry.technicianName}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{entry.totalClosed} tickets completed</p>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600">
                    {entry.totalClosed}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Pts</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="font-medium text-gray-900 dark:text-white">No tickets closed yet.</p>
            <p className="text-sm mt-1">Complete repairs to climb the leaderboard!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardWidget;
