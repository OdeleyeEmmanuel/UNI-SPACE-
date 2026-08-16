/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14213D',
        'ink-soft': '#2A3A5C',
        paper: '#FAF7F0',
        'paper-dim': '#F0EBDE',
        gold: '#C9A227',
        'gold-soft': '#E4CE83',
        sage: '#4C6B52',
        coral: '#C1462F',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        badge: '0 2px 0 0 rgba(20,33,61,0.15), 0 8px 20px -8px rgba(20,33,61,0.35)',
      },
    },
  },
  plugins: [],
};
