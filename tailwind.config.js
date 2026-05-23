/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Google Stitch / Material 3 Tonal Palette
        primary: {
          DEFAULT: '#1a73e8', // Google Blue
          container: '#d2e3fc',
          onContainer: '#174ea6',
        },
        secondary: {
          DEFAULT: '#34a853', // Google Green
          container: '#e6f4ea',
          onContainer: '#0d652d',
        },
        surface: {
          DEFAULT: '#ffffff',
          variant: '#f8f9fa',
          outline: '#dadce0',
        },
        error: {
          DEFAULT: '#d93025', // Google Red
          container: '#fce8e6',
          onContainer: '#a50e0e',
        }
      },
      borderRadius: {
        'google': '28px',
      },
      animation: {
        'pulse-soft': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
