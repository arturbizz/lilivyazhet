module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cotton: {
          50: '#FDFBF7',
          100: '#F7F1E3',
          200: '#EDE0C8',
          300: '#DCC7A3',
          400: '#C7A87B',
          500: '#B38B5B',
          600: '#9B7348',
          700: '#7E5C3A',
          800: '#63482D',
          900: '#4A3522',
        },
        thread: {
          rose: '#E8C4B8',
          mint: '#BFD8C1',
          sky: '#B7CFE0',
          lilac: '#D4C4D9',
          peach: '#F5D5C6',
          yellow: '#F3E0B0',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
        display: ['Cormorant Garamond', 'serif'], // добавим элегантный шрифт для заголовков
      },
      backgroundImage: {
        'knit-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dcc7a3' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
