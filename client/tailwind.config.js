/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0f1729',
          800: '#1a2744',
          700: '#243b67',
          600: '#2d4f8a',
        },
      },
    },
  },
  plugins: [],
};
