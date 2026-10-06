/** @type {import('tailwindcss').Config} */
export default {
  content: { relative: true, files: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ] },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Segoe UI Variable', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      fontWeight: { bold: '600', black: '700' },
      letterSpacing: { tighter: '0', tight: '0', normal: '0', wide: '0', wider: '0', widest: '0' },
      borderRadius: { xl: '8px', '2xl': '8px', '3xl': '8px' },
      boxShadow: {
        sm: '0 1px 2px rgba(25, 45, 53, 0.05)',
        md: '0 2px 8px rgba(25, 45, 53, 0.08)',
        lg: '0 4px 16px rgba(25, 45, 53, 0.10)',
        '2xl': '0 8px 24px rgba(25, 45, 53, 0.14)',
      },
      colors: {
        clinical: {
          50: '#edf7f5',
          100: '#d7eeea',
          200: '#b1ddd6',
          300: '#7ec6bb',
          400: '#3ba79a',
          500: '#117e75',
          600: '#0b6963',
          700: '#095650',
          800: '#0b4946',
          900: '#153d3b',
        }
      }
    },
  },
  plugins: [],
}
