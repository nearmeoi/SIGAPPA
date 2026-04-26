/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './resources/**/*.blade.php',
    './resources/**/*.js',
    './resources/**/*.ts',
    './resources/**/*.jsx',
    './resources/**/*.tsx',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        poltekpar: {
          primary: '#15325F',   // Biru utama SIGAP
          navy:    '#0D1F3C',   // Biru tua untuk teks heading & overlay
          accent:  '#1E4A8C',   // Biru menengah untuk hover & highlight
          gold:    '#DCAF67',   // Kuning brand Poltekpar
          'gold-light': '#F5E5BC', // Kuning muda untuk background badge
          light:   '#F5F7FB',   // Background halaman
          gray:    '#64748b'
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      spacing: {
        '18': '4.5rem',
        '68': '17rem',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 40px -10px rgba(0, 162, 255, 0.3)',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '10%': { transform: 'rotate(-14deg)' },
          '20%': { transform: 'rotate(14deg)' },
          '30%': { transform: 'rotate(-10deg)' },
          '40%': { transform: 'rotate(10deg)' },
          '50%': { transform: 'rotate(-6deg)' },
          '60%': { transform: 'rotate(6deg)' },
          '70%': { transform: 'rotate(-3deg)' },
          '80%': { transform: 'rotate(3deg)' },
          '90%': { transform: 'rotate(0deg)' },
        },
      },
      animation: {
        shake: 'shake 0.8s ease-in-out',
      },
    },
  },
  plugins: [],
}
