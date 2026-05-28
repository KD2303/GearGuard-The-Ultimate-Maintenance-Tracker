import React, { useMemo } from 'react';

interface HealthRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
  breakdown?: { factor: string; deduction: number }[];
}

const HealthRing: React.FC<HealthRingProps> = ({
  score,
  size = 60,
  strokeWidth = 6,
  showText = true,
  breakdown,
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
    <div className="relative inline-flex items-center justify-center group" style={{ width: size, height: size }}>
      <svg className={`transform -rotate-90 w-full h-full ${normalizedScore < 40 ? 'animate-critical-pulse' : ''}`} viewBox={`0 0 ${size} ${size}`}>
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
        <div className="absolute flex flex-col items-center justify-center font-bold pointer-events-none">
          <span className={`text-lg leading-none ${colorObj.textClass}`}>
            {normalizedScore}
          </span>
          <span className={`text-[9px] uppercase tracking-wider ${colorObj.textClass} opacity-80 mt-0.5`}>
            Health
          </span>
        </div>
      )}

      {/* Breakdown Tooltip */}
      {breakdown && breakdown.length > 0 && (
        <div className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 bottom-full mb-2 bg-gray-900 text-white text-xs rounded shadow-lg p-3 w-max min-w-[150px] max-w-[250px] text-center pointer-events-none">
          <p className="font-semibold border-b border-gray-700 pb-1 mb-2">Score Deductions</p>
          <ul className="text-left space-y-1">
            {breakdown.map((item, i) => (
              <li key={i} className="flex justify-between gap-4 text-gray-300">
                <span>{item.factor}:</span>
                <span className="text-red-400 font-bold">-{item.deduction}</span>
              </li>
            ))}
          </ul>
          <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-gray-900 transform -translate-x-1/2 rotate-45"></div>
        </div>
      )}
    </div>
  );
};

export default HealthRing;
