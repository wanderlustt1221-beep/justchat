/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#25D366',
        'primary-dark': '#128C7E',
        'bg-main': '#111B21',
        'bg-secondary': '#202C33',
        'bg-chat': '#0B141A',
        'text-primary': '#E9EDEF',
        'text-secondary': '#8696A0',
        'border-color': '#2A3942',
      },
    },
  },
  plugins: [],
};