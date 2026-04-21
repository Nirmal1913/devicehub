/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // DeviceHub theme colors - easily customizable for your organization
        primary: '#2563eb',      // Main brand color (blue)
        secondary: '#3b82f6',    // Secondary brand color (light blue)
        accent: '#10b981',       // Accent color (green)
        navy: '#1e3a8a',         // Dark shade
        muted: '#64748B',        // Muted text
        
        // Legacy compatibility (will map to theme colors)
        combank: {
          navy: '#1e3a8a',
          blue: '#2563eb',
          green: '#10b981',
          lightBlue: '#E6F2FF',
          slate: '#F8FAFC',
          gray: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};
