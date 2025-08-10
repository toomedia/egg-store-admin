/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        colors: {
          'custom-yellow': '#f6e79e',
          'custom-green': '#f7fcee',
          'custom-gray': '#F9FAFB',
        },
        fontFamily: {
          'poppins': ['Poppins', 'sans-serif'],
          'montserrat': ['Montserrat', 'sans-serif'],
          'manrope': ['Manrope', 'sans-serif'],
          'jetbrains': ['JetBrains Mono', 'monospace'],
        },
      },
    },
    plugins: [],
  } 