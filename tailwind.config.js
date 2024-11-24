/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          100: '#1a1b1e',
          200: '#2c2e33',
          300: '#25262b',
          400: '#373A40',
        },
      },
    },
  },
  plugins: [],
};