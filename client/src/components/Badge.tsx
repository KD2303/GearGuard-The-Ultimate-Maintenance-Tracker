import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'md', pulse = false, className }) => {
  const variants = {
    default: 'bg-gray-100/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200 border border-gray-200/50 dark:border-gray-600/50 hover:bg-gray-200/80 dark:hover:bg-gray-600/80',
    primary: 'bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50 hover:bg-blue-200/80 dark:hover:bg-blue-800/60 hover:shadow-lg hover:shadow-blue-500/20',
    success: 'bg-green-100/80 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-700/50 hover:bg-green-200/80 dark:hover:bg-green-800/60 hover:shadow-lg hover:shadow-green-500/20',
    warning: 'bg-yellow-100/80 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-200/50 dark:border-yellow-700/50 hover:bg-yellow-200/80 dark:hover:bg-yellow-800/60 hover:shadow-lg hover:shadow-yellow-500/20',
    danger: 'bg-red-100/80 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-700/50 hover:bg-red-200/80 dark:hover:bg-red-800/60 hover:shadow-lg hover:shadow-red-500/20',
    info: 'bg-cyan-100/80 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200/50 dark:border-cyan-700/50 hover:bg-cyan-200/80 dark:hover:bg-cyan-800/60 hover:shadow-lg hover:shadow-cyan-500/20',
    gradient: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700',
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-semibold rounded-full transition-all duration-300 backdrop-blur-sm',
        variants[variant],
        sizes[size],
        pulse && 'animate-pulse',
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
