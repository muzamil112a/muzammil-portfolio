/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#c9a227',
          dim: 'rgba(201, 162, 39, 0.6)',
          faint: 'rgba(201, 162, 39, 0.25)',
        },
        fog: {
          900: '#05070a',
          800: '#0a0e14',
          700: '#10151d',
          600: '#1a212c',
        },
      },
      fontFamily: {
        display: ['"Cinzel"', 'serif'],
        serif: ['"Cormorant Garamond"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
