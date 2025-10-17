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
          50: '#f5f6f4',
          100: '#e8eae5',
          200: '#d1d5cb',
          300: '#b0b8a7',
          400: '#8d9781',
          500: '#6f7a63',
          600: '#5a6350',
          700: '#4a5042',
          800: '#3d4137',
          900: '#34372f',
        },
      },
    },
  },
  plugins: [],
}
