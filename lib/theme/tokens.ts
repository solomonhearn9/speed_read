/**
 * SpeedRead design tokens — single source of truth for programmatic use.
 * CSS variables in globals.css mirror these values for runtime theming.
 */

export const colors = {
  background: {
    primary: '#0B0B0D',
    surface: '#17171B',
    surfaceAlt: '#1E1E23',
  },
  text: {
    primary: '#F5F5F4',
    muted: '#9B9BA3',
  },
  accent: {
    red: '#FF4438',
    redDim: '#3A1210',
  },
  secondary: {
    steel: '#5B6472',
  },
  /** @deprecated Prefer accent.red — kept for gradual migration */
  brand: {
    primary: '#FF4438',
    primaryHover: '#E53A2F',
    cyan: '#FF4438',
  },
  semantic: {
    success: '#22C55E',
    warning: '#EAB308',
    error: '#FF4438',
  },
  challenge: {
    cta: '#FF4438',
    ctaHover: '#E53A2F',
    ctaText: '#0B0B0D',
    bgStart: '#0B0B0D',
    bgEnd: '#17171B',
    glow: 'rgba(255, 68, 56, 0.12)',
  },
  reader: {
    bg: '#0B0B0D',
    surface: 'rgba(23, 23, 27, 0.92)',
    border: '#1E1E23',
    pivot: '#FF4438',
  },
  wpmTier: {
    t300: '#8A8580',
    t500: '#C4A574',
    t700: '#E8A87C',
    t900: '#FF4438',
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
  card: '0 1px 3px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.12)',
  cardHover: '0 4px 12px rgba(255, 68, 56, 0.12), 0 2px 4px rgba(0, 0, 0, 0.12)',
  elevated: '0 8px 24px rgba(0, 0, 0, 0.28)',
  badge: '0 2px 8px rgba(255, 68, 56, 0.2)',
} as const;

export type ThemeVariant = 'base' | 'adult' | 'kids' | 'challenge' | 'reader';
