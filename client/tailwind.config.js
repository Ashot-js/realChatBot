/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0b0b1a',
          800: '#0f0f24',
          700: '#13132e',
        },
        surface: {
          DEFAULT: '#151530',
          light: '#1a1a3e',
          lighter: '#222250',
        },
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
      },
      keyframes: {
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.3)' },
        },
        'wave': {
          '0%, 100%': { height: '4px' },
          '50%': { height: '16px' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
        'wave': 'wave 0.8s ease-in-out infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
