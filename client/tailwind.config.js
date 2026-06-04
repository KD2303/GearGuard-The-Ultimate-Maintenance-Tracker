/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        }
      },
      animation: {
        criticalPulse: {
          '0%, 100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))' },
          '50%': { transform: 'scale(1.05)', filter: 'drop-shadow(0 0 16px rgba(239, 68, 68, 1))' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        }
      },
      animation: {
        'critical-pulse': 'criticalPulse 1.5s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
      }
    },
  },

  plugins: [],
};