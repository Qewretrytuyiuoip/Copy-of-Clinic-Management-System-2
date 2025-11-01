/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}", // هذا السطر يخبر Tailwind أن يبحث عن الكلاسات في كل هذه الملفات
  ],
  darkMode: 'class', // تفعيل الوضع الليلي بناءً على وجود كلاس 'dark'
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#06b6d4',
          '50': '#ecfeff',
          '100': '#cffafe',
          '200': '#a5f3fd',
          '300': '#67e8f9',
          '400': '#22d3ee',
          '500': '#06b6d4',
          '600': '#0891b2',
          '700': '#0e7490',
          '800': '#155e75',
          '900': '#164e63',
          '950': '#083344',
        },
      }
    },
  },
  plugins: [],
}