/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      colors: {
        peach: {
          50: '#fff7f3',
          100: '#ffe8de',
          200: '#ffd0bc',
          300: '#ffb093',
          400: '#ff8860',
          500: '#f96b3a',
          600: '#e04e20',
        },
        lavender: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        cream: {
          50: '#fdfcf9',
          100: '#faf7f0',
          200: '#f3ede0',
          300: '#e8dfc9',
        },
        sage: {
          100: '#e8f0e9',
          200: '#c8deca',
          300: '#a4c7a7',
          400: '#72a376',
          500: '#4e8a53',
        },
        blush: {
          50: '#fff0f3',
          100: '#fde8ec',
          200: '#fcc9d4',
          300: '#f9a8bc',
          400: '#f472a0',
          500: '#e9547a',
          600: '#c2335c',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
