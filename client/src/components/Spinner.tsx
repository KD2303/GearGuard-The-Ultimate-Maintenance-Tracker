import React from 'react';
import { Loader } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
  centered?: boolean;
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  className = '', 
  label = 'Loading...',
  centered = false
}) => {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader
        className={`animate-spin text-purple-600 dark:text-purple-400 ${sizes[size]}`}
        aria-label={label || 'Loading'}
        role="status"
      />
      {label && <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>}
    </div>
  );

  if (centered) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] w-full py-10">
        {content}
      </div>
    );
  }

  return content;
};

export default Spinner;
