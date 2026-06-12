/**
 * Theme layer exports for future kids/adult theme swapping.
 * Apply via data-theme attribute on a root container element.
 */
export { colors, spacing, radius, shadows } from './tokens';
export type { ThemeVariant } from './tokens';

export const THEME_ATTRIBUTES = {
  base: undefined,
  adult: 'learning',
  challenge: 'challenge',
  reader: 'reader',
  kids: 'kids',
} as const;
