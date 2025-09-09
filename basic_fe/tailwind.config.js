/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",   // <-- important for React + TS
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};