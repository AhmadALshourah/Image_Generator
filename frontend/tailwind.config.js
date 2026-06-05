/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      animation: {
        'fade-up':   'fadeUp 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) both',
        'fade-in':   'fadeIn 0.5s ease both',
        'scale-in':  'scaleIn 0.4s cubic-bezier(0.22, 0.61, 0.36, 1) both',
        'slide-in':  'slideInRight 0.45s cubic-bezier(0.22, 0.61, 0.36, 1) both',
        'reveal':    'revealBlur 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) both',
        'pulse-ring':'pulseRing 1.8s ease-out infinite',
        'spin-fast': 'spin 0.9s linear infinite',
        'shimmer':   'shimmer 1.6s infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'none' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to:   { opacity: '1', transform: 'none' },
        },
        revealBlur: {
          from: { filter: 'blur(28px) saturate(1.4)', transform: 'scale(1.06)', opacity: '0.35' },
          to:   { filter: 'blur(0) saturate(1)',     transform: 'scale(1)',    opacity: '1' },
        },
        pulseRing: {
          '0%':   { boxShadow: '0 0 0 0 rgba(99,102,241,0.45)' },
          '70%':  { boxShadow: '0 0 0 7px rgba(99,102,241,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(99,102,241,0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};
