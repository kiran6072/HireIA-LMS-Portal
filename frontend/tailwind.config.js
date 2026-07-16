/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0B2A5B',
          50: '#EAF0FA',
          100: '#CBDAF0',
          200: '#9CB9E0',
          300: '#6D97D1',
          400: '#3E76C1',
          500: '#1C5AA6',
          600: '#153F7D',
          700: '#0B2A5B',
          800: '#081E42',
          900: '#051229',
        },
        secondary: {
          DEFAULT: '#F57C00',
          50: '#FFF3E5',
          100: '#FFE0B8',
          200: '#FFCA85',
          300: '#FFB352',
          400: '#FF9D26',
          500: '#F57C00',
          600: '#C96400',
          700: '#9C4E00',
          800: '#703800',
          900: '#442200',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Sora"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(11,42,91,0.08), 0 1px 2px rgba(11,42,91,0.06)',
        elevated: '0 8px 24px rgba(11,42,91,0.12)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
