module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Основа — светлая, почти белая
        surface: {
          50: '#FFFFFF',
          100: '#F8F9FA',
          200: '#F1F3F5',
          300: '#E9ECEF',
        },
        // Акцентные цвета (северное сияние)
        aurora: {
          green: '#00E5A0',
          blue: '#00C2FF',
          purple: '#7B61FF',
        },
        // Тёплый «ниточный» акцент из логотипа
        yarn: '#7E5C3A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Plus Jakarta Sans не содержит русских букв, поэтому кириллица
        // рисовалась системным шрифтом. Manrope — ближайший аналог с кириллицей.
        heading: ['Manrope', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
