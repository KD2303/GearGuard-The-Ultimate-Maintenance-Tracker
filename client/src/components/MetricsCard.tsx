import React from 'react';
import { clsx } from 'clsx';

interface MetricsCardProps {
  title: string;
  value: string | number;
  trend?: number;
  suffix?: string;
  className?: string;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ title, value, trend, suffix, className }) => {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const isNeutral = trend !== undefined && trend === 0;

  return (
    <div className={clsx(
      "p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md",
      className
    )}>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-300">{title}</p>
      <div className="mt-2 flex items-baseline justify-between">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}{suffix}
        </h3>
        {trend !== undefined && (
          <div className={clsx(
            "flex items-center text-xs font-semibold px-2 py-1 rounded-full",
            isPositive ? "text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/40" :
            isNegative ? "text-rose-600 bg-rose-50 dark:text-rose-300 dark:bg-rose-900/40" :
            "text-gray-600 bg-gray-50 dark:text-gray-300 dark:bg-gray-700/50"
          )}>
            {isPositive && <span className="mr-1">▲</span>}
            {isNegative && <span className="mr-1">▼</span>}
            {isNeutral && <span className="mr-1">→</span>}
            {Math.abs(trend)}%
            <span className="ml-1 text-[10px] font-normal dark:text-gray-300">this week</span>
          </div>
        )}
      </div>
    </div>
  );
};
