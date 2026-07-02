/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'baby-pink': '#FFB7C5',
        'baby-pink-dark': '#FF8FAA',
        'baby-pink-light': '#FFE4EB',
        'mint': '#B8F0D8',
        'mint-dark': '#7DDBB0',
        'mint-light': '#E4FAF1',
        'butter': '#FFE787',
        'butter-dark': '#FFD740',
        'butter-light': '#FFF8CC',
        'sky': '#B8DEFF',
        'sky-dark': '#7FC4FF',
        'sky-light': '#E4F3FF',
        'lavender': '#D4B8FF',
        'lavender-dark': '#B088FF',
        'lavender-light': '#EFE4FF',
        'peach': '#FFD4B8',
        'peach-dark': '#FFB07A',
        'cream': '#F7F6F3',
        'paper': '#FFFFFF',
      },
      fontFamily: {
        sans: ['Nunito', 'SUIT Variable', 'SUIT', '-apple-system', 'sans-serif'],
        title: ['OkDanDan', 'Nunito', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        'paper': '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'paper-md': '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'paper-lg': '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
        'sticker': '2px 3px 0px rgba(0,0,0,0.10)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'wiggle': 'wiggle 0.3s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        },
      },
    },
  },
  plugins: [],
}
