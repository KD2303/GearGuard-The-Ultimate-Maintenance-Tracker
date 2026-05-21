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
    default: 'bg-gray-100/80 text-gray-700 border border-gray-200/50 hover:bg-gray-200/80',
    primary: 'bg-blue-100/80 text-blue-700 border border-blue-200/50 hover:bg-blue-200/80 hover:shadow-lg hover:shadow-blue-500/20',
    success: 'bg-green-100/80 text-green-700 border border-green-200/50 hover:bg-green-200/80 hover:shadow-lg hover:shadow-green-500/20',
    warning: 'bg-yellow-100/80 text-yellow-700 border border-yellow-200/50 hover:bg-yellow-200/80 hover:shadow-lg hover:shadow-yellow-500/20',
    danger: 'bg-red-100/80 text-red-700 border border-red-200/50 hover:bg-red-200/80 hover:shadow-lg hover:shadow-red-500/20',
    info: 'bg-cyan-100/80 text-cyan-700 border border-cyan-200/50 hover:bg-cyan-200/80 hover:shadow-lg hover:shadow-cyan-500/20',
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
