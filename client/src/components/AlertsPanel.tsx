import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface AlertsPanelProps {
  overdue: any[];
  dueSoon: any[];
  capacity: any[];
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ overdue, dueSoon, capacity }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 h-full flex flex-col shadow-sm">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-rose-500" />
          System Alerts
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Overdue Section */}
        <section>
          <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-3">⚠️ Overdue Maintenance</h4>
          <div className="space-y-3">
            {overdue.length > 0 ? overdue.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between group cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.equipment}</p>
                  <p className="text-xs text-rose-500 dark:text-rose-400">{item.daysOverdue} days overdue</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
              </div>
            )) : (
              <p className="text-sm text-gray-500 dark:text-gray-300 italic">No overdue items</p>
            )}
          </div>
        </section>

        {/* Due Soon Section */}
        <section>
          <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">⚠️ Maintenance Due Soon (Next 7 days)</h4>
          <div className="space-y-3">
            {dueSoon.length > 0 ? dueSoon.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between group cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.equipment}</p>
                  <p className="text-xs text-amber-500">In {item.daysRemaining} days</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
              </div>
            )) : (
               <p className="text-sm text-gray-500 dark:text-gray-300 italic">No upcoming items</p>
            )}
          </div>
        </section>

        {/* Team Capacity Section */}
        <section>
          <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3">⚠️ Team Capacity</h4>
          <div className="space-y-4">
            {capacity.length > 0 ? capacity.map((member, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-900 dark:text-white font-medium">{member.name}</span>
                  <span className="text-xs text-gray-500">{member.assigned}/{member.total} assigned</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                  <div 
                    className={clsx(
                      "h-1.5 rounded-full",
                      member.percentage >= 90 ? "bg-rose-500" : "bg-amber-500"
                    )}
                    style={{ width: `${member.percentage}%` }}
                  ></div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500 dark:text-gray-300 italic">No team capacity warnings</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
