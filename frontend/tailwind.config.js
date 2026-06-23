/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef8ee',
          100: '#fdf0d5',
          200: '#fadca7',
          300: '#f6be70',
          400: '#f19c3b',
          500: '#e07613',
          600: '#c2530c',
          700: '#99370f',
          800: '#7a2b13',
          900: '#642414',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
