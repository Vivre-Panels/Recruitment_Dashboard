/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f4f8f1',
          100: '#e6f0e0',
          200: '#cee2c2',
          300: '#abcd9a',
          400: '#85b26f',
          500: '#5D9240',
          600: '#497731',
          700: '#3b5e29',
          800: '#324c24',
          900: '#2b4020',
          950: '#14230e',
        },
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
};
