// Colors, corner radii and card shadows come from CSS variables so the design can be switched (see src/designs.css).
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

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
        paper: { DEFAULT: v('paper'), dark: v('paper-dark') },
        card: v('card'),
        ink: { DEFAULT: v('ink'), soft: v('ink-soft'), dark: v('ink-dark'), darksoft: v('ink-darksoft') },
        teal: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => [n, v(`accent-${n}`)])),
        gold: Object.fromEntries([100, 300, 500, 700].map((n) => [n, v(`gold-${n}`)])),
        st: { new: v('st-new'), learning: v('st-learning'), known: v('st-known') },
      },
      borderRadius: { xl: 'var(--r-md)', '2xl': 'var(--r-lg)', '3xl': 'var(--r-xl)' },
      boxShadow: { card: 'var(--shadow-card)' },
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
