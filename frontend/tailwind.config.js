/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f172a', // Deep Blue
          light: '#1e293b',
          dark: '#020617',
        },
        secondary: {
          DEFAULT: '#f3f4f6', // Warm Gray
          dark: '#9ca3af',
          light: '#f9fafb',
        },
        accent: {
          DEFAULT: '#166534', // Forest Green
          light: '#22c55e',
          dark: '#14532d',
        },
        danger: {
          DEFAULT: '#ef4444', // Soft Red
          light: '#fee2e2',
        },
        warning: {
          DEFAULT: '#f59e0b', // Amber
          light: '#fef3c7',
        },
        success: {
          DEFAULT: '#10b981', // Emerald Green
          light: '#d1fae5',
        },
        vault: {
          bg: '#0a0e1a',
          card: '#13192b',
          border: '#222d44',
          text: '#f8fafc',
          muted: '#94a3b8'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
