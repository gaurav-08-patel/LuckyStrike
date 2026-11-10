/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        paper: '#F5F0EB',
        ink: '#171310',
        pink: '#FF3D8C',
        red: '#F24B4B',
        gold: '#FFD769',
        mint: '#3ACF7E',
      },
      boxShadow: {
        punch: '4px 4px 0 #171310',
      },
    },
  },
  plugins: [],
};
