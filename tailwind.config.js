/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-general-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      colors: {
        /* Legacy alias — challenge pivot */
        'anchor-red': 'var(--accent-red)',
        /* Brand (maps to accent-red) */
        brand: {
          DEFAULT: 'var(--accent-red)',
          hover: 'var(--accent-red-hover)',
          cyan: 'var(--accent-red)',
        },
        /* Surfaces */
        surface: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-surface)',
          card: 'var(--bg-surface)',
          elevated: 'var(--bg-surface-alt)',
          alt: 'var(--bg-surface-alt)',
        },
        /* Text */
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-muted)',
          muted: 'var(--text-muted)',
          disabled: 'var(--text-muted)',
        },
        /* Borders */
        line: {
          DEFAULT: 'var(--bg-surface-alt)',
        },
        /* Accents */
        accent: {
          red: 'var(--accent-red)',
          'red-dim': 'var(--accent-red-dim)',
        },
        steel: 'var(--secondary-steel)',
        /* Semantic */
        success: {
          DEFAULT: '#22C55E',
          light: '#14532D',
        },
        warning: {
          DEFAULT: '#EAB308',
          light: '#422006',
        },
        /* Challenge funnel */
        challenge: {
          cta: 'var(--challenge-cta)',
          'cta-hover': 'var(--challenge-cta-hover)',
          'bg-start': 'var(--challenge-bg-start)',
          'bg-end': 'var(--challenge-bg-end)',
        },
        /* Reader */
        reader: {
          bg: 'var(--reader-bg)',
          surface: 'var(--reader-surface)',
          border: 'var(--reader-border)',
          pivot: 'var(--reader-pivot)',
        },
      },
      borderRadius: {
        card: '1rem',
        badge: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.12)',
        'card-hover': '0 4px 12px rgba(255, 68, 56, 0.12), 0 2px 4px rgba(0, 0, 0, 0.12)',
        elevated: '0 8px 24px rgba(0, 0, 0, 0.28)',
        badge: '0 2px 8px rgba(255, 68, 56, 0.2)',
      },
      spacing: {
        section: '2.5rem',
        'section-lg': '3.5rem',
      },
    },
  },
  plugins: [],
};
