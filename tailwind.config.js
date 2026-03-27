/** @type {import('tailwindcss').Config} */
module.exports = {
   darkMode: 'class',
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
          'sans': ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
          'serif': ['var(--font-playfair)', 'Georgia', 'serif'],
          'jetbrains': ['JetBrains Mono', 'monospace'],
        },
      },
    },
    plugins: [],
  } 