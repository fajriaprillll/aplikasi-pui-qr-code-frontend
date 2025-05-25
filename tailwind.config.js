/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kedai: {
          red: '#E20C0C',
          black: '#000000',
        }
      },
    },
  },
  plugins: [],
} 