/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        paper: '#fffaf6',
        warm: '#fff7ef',
        ink: '#171310',
        pink: '#ff2d78',
        red: '#ff3b30',
        yellow: '#ffd400',
        mint: '#3acf7e',
      },
      boxShadow: {
        punch: '4px 4px 0 #171310',
      },
      fontFamily: {
        display: ['Anton', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
