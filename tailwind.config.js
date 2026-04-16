/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#7B2FF7', light: '#9F5AFD', dark: '#5B1FBD' },
      },
    },
  },
  plugins: [],
}
