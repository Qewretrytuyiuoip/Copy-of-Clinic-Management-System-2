/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // PRIMARY COLORS
        primary: {
          DEFAULT: '#1A73E8',
          '50': '#E3F2FD',
          '100': '#BBDEFB',
          '200': '#90CAF9',
          '300': '#63A4FF',
          '400': '#42A5F5',
          '500': '#1A73E8',
          '600': '#0F4CBA',
          '700': '#1565C0',
          '800': '#0D47A1',
          '900': '#0A367A',
          '950': '#051E3C',
        },
        // SECONDARY COLORS
        secondary: {
          DEFAULT: '#6CD4B1',
          '50': '#E0F7F3',
          '100': '#B2EBE0',
          '200': '#80DDC9',
          '300': '#4AC8E2',
          '400': '#26BACE',
          '500': '#6CD4B1',
          '600': '#4FA88A',
          '700': '#387E66',
          '800': '#255645',
          '900': '#143328',
        },
        // BACKGROUND & NEUTRALS MAPPING
        gray: {
          '50': '#FFFFFF',
          '100': '#F7F9FC', // Light Background
          '200': '#E2E8F0',
          '300': '#CBD5E1',
          '400': '#94A3B8',
          '500': '#64748B',
          '600': '#475569',
          '700': '#334155',
          '800': '#1E293B',
          '900': '#0F172A', // Dark Background
        },
        // SURFACE MAPPING FOR DARK MODE
        slate: {
          '50': '#F8FAFC',
          '100': '#F1F5F9',
          '200': '#E2E8F0',
          '300': '#CBD5E1',
          '400': '#94A3B8',
          '500': '#64748B',
          '600': '#475569',
          '700': '#273447', // Dark Elevated Card
          '800': '#1E293B', // Dark Surface
          '900': '#0F172A',
        },
        // STATUS COLORS
        success: '#4CAF50',
        warning: '#FFC107',
        error: '#F44336',
        green: {
            '50': '#E8F5E9',
            '100': '#C8E6C9',
            '500': '#4CAF50',
            '600': '#43A047',
            '700': '#388E3C',
        },
        red: {
            '50': '#FFEBEE',
            '100': '#FFCDD2',
            '500': '#F44336',
            '600': '#E53935',
            '700': '#D32F2F',
        },
        yellow: {
            '50': '#FFFDE7',
            '100': '#FFF9C4',
            '400': '#FFC107',
            '500': '#FFB300',
            '600': '#FDD835',
        }
      }
    },
  },
  plugins: [],
}