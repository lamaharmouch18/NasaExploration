/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        bg: '#080d1c',
        bg2: '#0d1530',
        panel: '#131c3a',
        panel2: '#18234a',
        line: '#26335f',
        muted: '#9aa8d4',
        ink: '#e8edff',
        accent: '#4cc9f0',
        accent2: '#7b8cff',
        nominal: '#3ddc97',
        advisory: '#ffd166',
        warning: '#ff9f43',
        critical: '#ff5d73'
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif']
      }
    }
  },
  plugins: []
};
