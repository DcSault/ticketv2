/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'um-olive': {
          50: '#f7f8f5',
          100: '#eef0e8',
          200: '#dce0d1',
          300: '#c0c9ac',
          400: '#a3af85',
          500: '#8a9766',
          600: '#6b7d3d',
          700: '#576737',
          800: '#47532e',
          900: '#3b4527',
        },
      },
    },
  },
  plugins: [],
}
