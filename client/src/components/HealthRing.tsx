import React, { useMemo } from 'react';

interface HealthRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
}

const HealthRing: React.FC<HealthRingProps> = ({
  score,
  size = 60,
  strokeWidth = 6,
  showText = true,
}) => {
  // Clamp score between 0 and 100
  const normalizedScore = Math.min(100, Math.max(0, score));

  // Determine color based on score
  const colorObj = useMemo(() => {
    if (normalizedScore >= 75) {
      return {
        gradientStart: '#34d399', // emerald-400
        gradientEnd: '#059669', // emerald-600
        textClass: 'text-emerald-600 dark:text-emerald-400',
        shadow: 'drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]',
      };
    } else if (normalizedScore >= 40) {
      return {
        gradientStart: '#fbbf24', // amber-400
        gradientEnd: '#d97706', // amber-600
        textClass: 'text-amber-600 dark:text-amber-400',
        shadow: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]',
      };
    } else {
      return {
        gradientStart: '#f87171', // red-400
        gradientEnd: '#dc2626', // red-600
        textClass: 'text-red-600 dark:text-red-400',
        shadow: 'drop-shadow-[0_0_8px_rgba(248,113,113,0.6)]',
      };
    }
  }, [normalizedScore]);

  // SVG calculations
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={`gradient-${normalizedScore}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorObj.gradientStart} />
            <stop offset="100%" stopColor={colorObj.gradientEnd} />
          </linearGradient>
        </defs>

        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700 opacity-30"
        />

        {/* Progress Ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={`url(#gradient-${normalizedScore})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${colorObj.shadow}`}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>

      {/* Center Text */}
      {showText && (
        <div className="absolute flex flex-col items-center justify-center font-bold">
          <span className={`text-lg leading-none ${colorObj.textClass}`}>
            {normalizedScore}
          </span>
          <span className={`text-[9px] uppercase tracking-wider ${colorObj.textClass} opacity-80 mt-0.5`}>
            Health
          </span>
        </div>
      )}
    </div>
  );
};

export default HealthRing;
