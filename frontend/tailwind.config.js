/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-24px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        bounceIn: {
          '0%':   { opacity: '0', transform: 'scale(0.5)' },
          '70%':  { transform: 'scale(1.1)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        flashBorder: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-12deg)' },
          '50%':      { transform: 'rotate(12deg)' },
        },
      },
      animation: {
        slideIn:      'slideIn 0.3s ease-out',
        slideDown:    'slideDown 0.4s ease-out',
        bounceIn:     'bounceIn 0.4s ease-out',
        flashBorder:  'flashBorder 0.5s ease-in-out 6',
        wiggle:       'wiggle 0.3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

