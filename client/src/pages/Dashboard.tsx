import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { requestService } from '../services/requestService';
import { equipmentService } from '../services/equipmentService';
import { teamService } from '../services/teamService';
import { Wrench, Box, Users, AlertCircle, Clock, Search } from 'lucide-react';
import Badge from '../components/Badge';
import TeamActivity from '../components/TeamActivity';
import QuickActionCards from '../components/QuickActionCards';
import { globalSearch } from '../services/searchService';
import { GlobalSearchResults } from '../types';
import SearchDropdown from '../components/SearchDropdown';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalRequests: 0,
    newRequests: 0,
    inProgressRequests: 0,
    totalEquipment: 0,
    underMaintenance: 0,
    totalTeams: 0,
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResults>({
    equipment: [],
    requests: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [requests, equipment, teams] = await Promise.all([
          requestService.getAll(),
          equipmentService.getAll(),
          teamService.getAllTeams(),
        ]);

        setStats({
          totalRequests: requests.length,
          newRequests: requests.filter((r) => r.stage === 'new').length,
          inProgressRequests: requests.filter((r) => r.stage === 'in-progress').length,
          totalEquipment: equipment.length,
          underMaintenance: equipment.filter((e) => e.status === 'under-maintenance').length,
          totalTeams: teams.length,
        });

        setRecentRequests(requests.slice(0, 5));
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults({ equipment: [], requests: [] });
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);
      try {
        const results = await globalSearch(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const statCards = [
    {
      title: 'Total Requests',
      value: stats.totalRequests,
      icon: Wrench,
      gradient: 'from-blue-500 to-cyan-600',
      link: '/requests',
      trend: '+12%',
    },
    {
      title: 'New Requests',
      value: stats.newRequests,
      icon: AlertCircle,
      gradient: 'from-yellow-500 to-orange-600',
      link: '/requests',
      trend: '+5%',
    },
    {
      title: 'In Progress',
      value: stats.inProgressRequests,
      icon: Clock,
      gradient: 'from-purple-500 to-pink-600',
      link: '/requests',
      trend: '+8%',
    },
    {
      title: 'Total Equipment',
      value: stats.totalEquipment,
      icon: Box,
      gradient: 'from-green-500 to-teal-600',
      link: '/equipment',
      trend: '+3%',
    },
    {
      title: 'Under Maintenance',
      value: stats.underMaintenance,
      icon: Wrench,
      gradient: 'from-red-500 to-pink-600',
      link: '/equipment',
      trend: '-2%',
    },
    {
      title: 'Maintenance Teams',
      value: stats.totalTeams,
      icon: Users,
      gradient: 'from-indigo-500 to-purple-600',
      link: '/teams',
      trend: '0%',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="rounded-3xl border border-white/50 bg-white/70 p-4 shadow-lg backdrop-blur-sm md:p-5">
        <div ref={searchRef} className="relative w-full">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 md:h-5 md:w-5 z-10" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim() !== '') setShowDropdown(true);
            }}
            placeholder="Search equipment, requests..."
            className="w-full rounded-2xl border border-gray-200/70 bg-white px-10 py-3 text-sm text-gray-700 placeholder-gray-400 shadow-sm outline-none transition-all duration-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 md:py-3.5"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults({ equipment: [], requests: [] });
                setShowDropdown(false);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs z-10"
            >
              ✕
            </button>
          )}
          {showDropdown && (
            <SearchDropdown
              results={searchResults}
              query={searchQuery}
              isLoading={isSearching}
              onClose={() => {
                setShowDropdown(false);
                setSearchQuery('');
              }}
            />
          )}
        </div>
      </div>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 md:p-12 shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome Back! 👋
          </h2>
          <p className="text-blue-100 text-lg max-w-2xl">
            GearGuard: The Ultimate Maintenance Tracker - Monitor, manage, and maintain your equipment with ease
          </p>
        </div>
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-white/10 backdrop-blur-3xl"></div>
        <div className="absolute bottom-0 left-1/2 -mb-8 -ml-8 h-48 w-48 rounded-full bg-white/10 backdrop-blur-3xl"></div>
      </div>

      {/* Quick Action Cards */}
      <QuickActionCards />

      {/* Stats Grid with Modern Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300" 
                 style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }}></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <span className={`text-sm font-semibold ${stat.trend.startsWith('+') ? 'text-green-600' : stat.trend.startsWith('-') ? 'text-red-600' : 'text-gray-600'}`}>
                    {stat.trend}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {stat.value}
                </p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-500 group-hover:text-purple-600 transition-colors">
                  View Details →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two Column Layout for Activity and Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Team Activity Summary */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Recent Activity</h3>
            <Link to="/activity" className="text-sm text-white/90 hover:text-white font-semibold transition-colors">
              View All →
            </Link>
          </div>
          <TeamActivity />
        </div>

        {/* Recent Requests Summary */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Recent Requests</h3>
            <Link to="/requests-all" className="text-sm text-white/90 hover:text-white font-semibold transition-colors">
              View All →
            </Link>
          </div>
          <div className="p-6">
            {recentRequests.length > 0 ? (
              <div className="space-y-3">
                {recentRequests.map((request, idx) => (
                  <div
                    key={request.id}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-white p-4 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{request.subject}</h4>
                          <Badge
                            variant={
                              request.stage === 'new'
                                ? 'info'
                                : request.stage === 'in-progress'
                                ? 'warning'
                                : request.stage === 'repaired'
                                ? 'success'
                                : 'danger'
                            }
                            size="sm"
                          >
                            {request.stage}
                          </Badge>
                          <Badge
                            variant={
                              request.type === 'corrective' ? 'warning' : 'info'
                            }
                            size="sm"
                          >
                            {request.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{request.requestNumber}</p>
                        {request.equipment && (
                          <p className="text-sm text-gray-500 mt-1">
                            Equipment: {request.equipment.name}
                          </p>
                        )}
                      </div>
                      {request.assignedTo && (
                        <div className="text-right ml-4">
                          <p className="text-sm text-gray-600">
                            {request.assignedTo.name}
                          </p>
                          <p className="text-xs text-gray-500">{request.assignedTo.role}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent requests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new maintenance request.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
