/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'royale-bg': '#121212',
        'royale-panel': '#1e1e1e',
        'royale-gold-light': '#fce14b',
        'royale-gold': '#f59f00',
        'royale-gold-dark': '#c97800',
        'royale-blue-light': '#4baafc',
        'royale-blue': '#007bf5',
        'royale-blue-dark': '#0056c9',
        'royale-green-light': '#4bfc6e',
        'royale-green': '#00f53d',
        'royale-green-dark': '#00c92a',
        'elixir': '#d0f',
        'elixir-dark': '#90c',
      },
      fontFamily: {
        'titan': ['"Titan One"', 'cursive', 'fantasy'],
      },
      boxShadow: {
        'royale-3d': '0 4px 0 rgba(0, 0, 0, 0.4)',
        'royale-battle': '0 6px 0 #c97800, 0 10px 10px rgba(0,0,0,0.3)',
        'royale-blue': '0 6px 0 #0056c9, 0 10px 10px rgba(0,0,0,0.3)',
        'royale-green': '0 6px 0 #00c92a, 0 10px 10px rgba(0,0,0,0.3)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      }
    },
  },
  plugins: [],
}
