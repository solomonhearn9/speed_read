/**
 * Shared WPM tier colors for the challenge counter and landing legend.
 * Ladder climbs warm neutrals → brand red only at the top (900+).
 */

export const WPM_TIER_THRESHOLDS = [
  { minWpm: 300, label: '300 WPM', cssVar: '--wpm-tier-300', fallback: '#8A8580' },
  { minWpm: 500, label: '500 WPM', cssVar: '--wpm-tier-500', fallback: '#C4A574' },
  { minWpm: 700, label: '700 WPM', cssVar: '--wpm-tier-700', fallback: '#E8A87C' },
  { minWpm: 900, label: '900+ WPM', cssVar: '--wpm-tier-900', fallback: '#FF4438' },
] as const;

/** CSS color value for a live WPM readout (matches landing legend). */
export function getWpmTierColor(wpm: number): string {
  if (wpm >= 900) return 'var(--wpm-tier-900)';
  if (wpm >= 700) return 'var(--wpm-tier-700)';
  if (wpm >= 500) return 'var(--wpm-tier-500)';
  if (wpm >= 300) return 'var(--wpm-tier-300)';
  return 'var(--text-muted)';
}
