/**
 * SpeedRead design tokens — single source of truth for programmatic use.
 * CSS variables in globals.css mirror these values for runtime theming.
 */

export const colors = {
  background: {
    primary: '#F8FAFC',
    secondary: '#EEF6FF',
    card: '#FFFFFF',
    elevated: '#F8FBFF',
  },
  border: {
    default: '#DCE7F5',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#64748B',
    disabled: '#94A3B8',
  },
  brand: {
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    cyan: '#38BDF8',
  },
  semantic: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  challenge: {
    cta: '#EF4444',
    ctaHover: '#DC2626',
    bgStart: '#07111F',
    bgEnd: '#0B172A',
    glow: 'rgba(56, 189, 248, 0.12)',
  },
  reader: {
    bg: '#0B1220',
    surface: 'rgba(11, 18, 32, 0.92)',
    border: '#1E293B',
    pivot: '#60A5FA',
  },
} as const;

export const spacing = {
  section: '2.5rem',
  sectionLg: '3.5rem',
  card: '1.25rem',
  cardLg: '1.5rem',
} as const;

export const radius = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
  full: '9999px',
} as const;

export const shadows = {
  card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
  cardHover: '0 4px 12px rgba(37, 99, 235, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)',
  elevated: '0 8px 24px rgba(15, 23, 42, 0.08)',
  badge: '0 2px 8px rgba(37, 99, 235, 0.15)',
} as const;

export type ThemeVariant = 'base' | 'adult' | 'kids' | 'challenge' | 'reader';
