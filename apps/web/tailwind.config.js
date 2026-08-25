/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Verde césped: la identidad. Oscuro y saturado, no el verde "farmacia".
        cancha: {
          50: '#ecfdf3',
          100: '#d1fadf',
          200: '#a6f4c5',
          300: '#6ce9a6',
          400: '#32d583',
          500: '#12b76a',
          600: '#039855',
          700: '#027a48',
          800: '#05603a',
          900: '#054f31',
          950: '#032b1c',
        },
        // Lima de transmisión deportiva: para destacar, nunca para texto largo.
        lima: {
          300: '#d9f99d',
          400: '#bef264',
          500: '#a3e635',
          600: '#84cc16',
        },
        // Tarjetas: significado universal en fútbol.
        amarilla: '#fbbf24',
        roja: '#ef4444',
        // Superficie oscura de las zonas "estadio".
        pizarra: {
          800: '#111a18',
          900: '#0a1210',
          950: '#050a09',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        vidrio: '0 8px 32px -8px rgb(3 43 28 / 0.18), inset 0 1px 0 0 rgb(255 255 255 / 0.6)',
        'vidrio-oscuro':
          '0 8px 32px -8px rgb(0 0 0 / 0.5), inset 0 1px 0 0 rgb(255 255 255 / 0.12)',
        alzado: '0 1px 2px rgb(3 43 28 / 0.06), 0 4px 16px -4px rgb(3 43 28 / 0.08)',
      },
      keyframes: {
        entrada: {
          from: { opacity: '0', transform: 'translateY(8px) scale(.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        aparecer: { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        entrada: 'entrada .18s cubic-bezier(.16,1,.3,1)',
        aparecer: 'aparecer .15s ease-out',
      },
    },
  },
  plugins: [],
};
