/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Legacy alias — challenge pivot only */
        'anchor-red': '#EF4444',
        /* Brand */
        brand: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          cyan: '#38BDF8',
        },
        /* Surfaces */
        surface: {
          primary: '#F8FAFC',
          secondary: '#EEF6FF',
          card: '#FFFFFF',
          elevated: '#F8FBFF',
        },
        /* Text */
        content: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#64748B',
          disabled: '#94A3B8',
        },
        /* Borders */
        line: {
          DEFAULT: '#DCE7F5',
        },
        /* Semantic */
        success: {
          DEFAULT: '#22C55E',
          light: '#DCFCE7',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        /* Challenge funnel */
        challenge: {
          cta: '#EF4444',
          'cta-hover': '#DC2626',
          'bg-start': '#07111F',
          'bg-end': '#0B172A',
        },
        /* Reader */
        reader: {
          bg: '#0B1220',
          surface: '#0F1729',
          border: '#1E293B',
          pivot: '#60A5FA',
        },
      },
      borderRadius: {
        card: '1rem',
        badge: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 4px 12px rgba(37, 99, 235, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)',
        elevated: '0 8px 24px rgba(15, 23, 42, 0.08)',
        badge: '0 2px 8px rgba(37, 99, 235, 0.15)',
      },
      spacing: {
        section: '2.5rem',
        'section-lg': '3.5rem',
      },
    },
  },
  plugins: [],
};
