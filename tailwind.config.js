/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#3b82f6', // blue-500
          dark: '#60a5fa'   // blue-400
        },
        secondary: {
          light: '#10b981', // emerald-500
          dark: '#34d399'   // emerald-400
        }
      }
    }
  },
  plugins: []
}; 