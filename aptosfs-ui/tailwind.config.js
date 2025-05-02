/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // macOS Finder-inspired colors
        'finder-blue': '#0969da',
        'finder-gray': '#f5f5f7',
        'finder-dark': '#1d1d1f',
        'finder-border': '#d2d2d7',
        'sidebar-bg': '#f5f5f7',
        'window-header': '#e9e9e9',
      },
      fontFamily: {
        'system': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'window': '0 2px 10px rgba(0, 0, 0, 0.1)',
        'menu': '0 5px 15px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'finder': '8px',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}