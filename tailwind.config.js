/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        quran: ['"Amiri Quran"', 'serif'],
        ui: ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        urdu: ['"Noto Nastaliq Urdu"', '"Jameel Noori Nastaleeq"', '"Urdu Typesetting"', 'serif'],
      },
      colors: {
        paper: { DEFAULT: '#faf7f0', dark: '#12161a' },
        ink: { DEFAULT: '#1d2a2a', soft: '#5b6b68', dark: '#e8e4da', darksoft: '#9aa6a3' },
        teal: { 50: '#eef7f5', 100: '#d5ece7', 200: '#a9d8cf', 400: '#4aa494', 500: '#2a8a79', 600: '#1f6f62', 700: '#185a50', 900: '#0d322d' },
        gold: { 100: '#f6ecd3', 300: '#e3c67f', 500: '#c49a3a', 700: '#8a6a22' },
        st: { new: '#7c8ea8', learning: '#d39a2c', known: '#2a8a79' },
      },
      boxShadow: { card: '0 1px 2px rgba(0,0,0,.04), 0 8px 24px -12px rgba(20,50,45,.25)' },
      keyframes: {
        pop: { '0%': { transform: 'scale(.96)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-6px)' }, '75%': { transform: 'translateX(6px)' } },
        up: { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
        fade: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
      },
      animation: { pop: 'pop .25s ease-out', shake: 'shake .3s ease-in-out', up: 'up .28s cubic-bezier(.2,.8,.2,1)', fade: 'fade .2s ease-out' },
    },
  },
  plugins: [],
};
