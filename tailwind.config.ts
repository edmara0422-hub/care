import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'sans-serif'],
      },
      colors: {
        bg:       '#0A0A0A',
        surface:  '#111111',
        surface2: '#1A1A1A',
        surface3: '#242424',
        silver:   '#C8C8C8',
        muted:    '#707070',
        subtle:   '#3A3A3A',
        good:     '#00D4A0',
        medium:   '#FFB800',
        warning:  '#FF7A00',
        critical: '#FF4466',
      },
      animation: {
        'pulse-slow':  'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow':        'glow 3s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
        'spin-slow':   'spin 8s linear infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config
