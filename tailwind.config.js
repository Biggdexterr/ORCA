/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        body: ['"Barlow Condensed"', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.2em',
        military: '0.3em',
      },
      colors: {
        // These are fallback values; actual theming done via CSS vars
        'bg-base': 'var(--bg-base)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-overlay': 'var(--bg-overlay)',
        'border-default': 'var(--border-default)',
        'border-strong': 'var(--border-strong)',
        'border-accent': 'var(--border-accent)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-glow': 'var(--accent-glow)',
        'signal-bull': 'var(--signal-bull)',
        'signal-bear': 'var(--signal-bear)',
        'signal-watch': 'var(--signal-watch)',
        'signal-alert': 'var(--signal-alert)',
        'accent-critical': 'var(--accent-critical)',
      },
    },
  },
  plugins: [],
};
