import React, { useState, useEffect, useMemo } from 'react';
import { MaintenanceRequest } from '../types';
import { requestService } from '../services/requestService';
import { addDays, subDays, startOfDay, format, differenceInDays, isSameDay } from 'date-fns';
import { useTranslation } from 'react-i18next';
import Spinner from '../components/Spinner';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import Badge from '../components/Badge';

const DowntimeGantt: React.FC = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(subDays(startOfDay(new Date()), 2));
  const { t } = useTranslation();

  const daysToShow = 14;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const allRequests = await requestService.getAll();
      
      // Filter requests that are open or recently scheduled, and have a scheduledDate
      const scheduled = allRequests.filter(req => 
        req.scheduledDate && 
        req.stage !== 'repaired' && 
        req.stage !== 'scrap' &&
        req.equipment
      );
      setRequests(scheduled);
    } catch (error) {
      console.error('Failed to load maintenance schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => setStartDate(prev => subDays(prev, 7));
  const handleNext = () => setStartDate(prev => addDays(prev, 7));
  const handleToday = () => setStartDate(subDays(startOfDay(new Date()), 2));

  // Generate array of dates to show on X-axis
  const dateHeaders = useMemo(() => {
    return Array.from({ length: daysToShow }).map((_, i) => addDays(startDate, i));
  }, [startDate, daysToShow]);

  // Group requests by equipment
  const equipmentGroups = useMemo(() => {
    const groups: Record<string, { equipmentName: string, equipmentStatus: string, requests: MaintenanceRequest[] }> = {};
    
    requests.forEach(req => {
      if (!req.equipmentId || !req.equipment) return;
      const eqId = typeof req.equipmentId === 'string' ? req.equipmentId : req.equipmentId._id || req.equipment.id;
      if (!eqId) return;

      if (!groups[eqId]) {
        groups[eqId] = {
          equipmentName: req.equipment.name || 'Unknown Equipment',
          equipmentStatus: req.equipment.status || 'unknown',
          requests: []
        };
      }
      groups[eqId].requests.push(req);
    });
    
    return Object.values(groups).sort((a, b) => a.equipmentName.localeCompare(b.equipmentName));
  }, [requests]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 hover:bg-red-600 border-red-700 text-white';
      case 'high': return 'bg-orange-500 hover:bg-orange-600 border-orange-700 text-white';
      case 'medium': return 'bg-yellow-400 hover:bg-yellow-500 border-yellow-600 text-slate-900';
      case 'low': return 'bg-green-500 hover:bg-green-600 border-green-700 text-white';
      default: return 'bg-blue-500 hover:bg-blue-600 border-blue-700 text-white';
    }
  };

  if (loading) {
    return <Spinner size="lg" label="Loading downtime schedule..." centered />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-500" />
            Equipment Downtime Schedule
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visual timeline of scheduled maintenance and planned outages
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <button 
            onClick={handlePrev}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
            title="Previous Week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={handleToday}
            className="px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-200 flex items-center gap-2"
          >
            <CalendarIcon className="w-4 h-4" />
            Today
          </button>
          <button 
            onClick={handleNext}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
            title="Next Week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Priority Legend:</span>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500"></div><span className="text-xs text-slate-600 dark:text-slate-400">Urgent</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-orange-500"></div><span className="text-xs text-slate-600 dark:text-slate-400">High</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-yellow-400"></div><span className="text-xs text-slate-600 dark:text-slate-400">Medium</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500"></div><span className="text-xs text-slate-600 dark:text-slate-400">Low</span></div>
      </div>

      {/* Gantt Chart Container */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Chart Header (Dates) */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="w-64 flex-shrink-0 p-4 font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 flex items-center">
                Equipment
              </div>
              <div className="flex-1 flex">
                {dateHeaders.map((date, i) => {
                  const isToday = isSameDay(date, new Date());
                  return (
                    <div 
                      key={i} 
                      className={`flex-1 flex flex-col items-center justify-center p-2 border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                    >
                      <span className={`text-xs font-semibold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {format(date, 'EEE')}
                      </span>
                      <span className={`text-sm ${isToday ? 'font-bold text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {format(date, 'MMM d')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart Body */}
            {equipmentGroups.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No scheduled downtime in this timeframe.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {equipmentGroups.map((group, groupIdx) => (
                  <div key={groupIdx} className="flex hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Equipment Name Column */}
                    <div className="w-64 flex-shrink-0 p-4 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-center">
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate" title={group.equipmentName}>
                        {group.equipmentName}
                      </span>
                      <Badge variant={group.equipmentStatus === 'under-maintenance' ? 'warning' : 'default'} size="sm" className="w-max mt-1">
                        {group.equipmentStatus}
                      </Badge>
                    </div>

                    {/* Timeline Column */}
                    <div className="flex-1 flex relative">
                      {/* Grid background */}
                      {dateHeaders.map((date, i) => (
                        <div 
                          key={i} 
                          className={`flex-1 border-r border-slate-100 dark:border-slate-700/50 last:border-r-0 ${isSameDay(date, new Date()) ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                        ></div>
                      ))}

                      {/* Request Blocks */}
                      <div className="absolute inset-0 pt-2 pb-2">
                        {group.requests.map((req, reqIdx) => {
                          if (!req.scheduledDate) return null;
                          const reqStart = startOfDay(new Date(req.scheduledDate));
                          const daysFromStart = differenceInDays(reqStart, startDate);
                          
                          // Calculate block width based on duration (1 day min)
                          const durationHours = req.duration || 8; // Default 8 hours
                          let spanDays = Math.max(1, Math.ceil(durationHours / 24));
                          
                          // If outside visible range, don't render
                          if (daysFromStart + spanDays < 0 || daysFromStart >= daysToShow) return null;
                          
                          // Clamp rendering constraints
                          const renderStart = Math.max(0, daysFromStart);
                          const renderSpan = Math.min(daysToShow - renderStart, spanDays - (renderStart - daysFromStart));
                          
                          const leftPercent = (renderStart / daysToShow) * 100;
                          const widthPercent = (renderSpan / daysToShow) * 100;
                          
                          return (
                            <div
                              key={req.id || reqIdx}
                              className={`absolute top-2 h-10 rounded-md border shadow-sm flex items-center px-2 cursor-pointer transition-transform hover:scale-[1.02] ${getPriorityColor(req.priority)}`}
                              style={{ 
                                left: `${leftPercent}%`, 
                                width: `calc(${widthPercent}% - 4px)`,
                                marginLeft: '2px',
                                marginTop: `${reqIdx * 48}px`, // Stagger overlapping requests vertically
                                zIndex: 10
                              }}
                              title={`${req.subject}\nScheduled: ${format(new Date(req.scheduledDate), 'PPp')}\nPriority: ${req.priority}\nDuration: ${durationHours}h`}
                            >
                              <span className="text-xs font-semibold truncate">
                                {req.subject}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DowntimeGantt;
