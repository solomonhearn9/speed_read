/**
 * Conversion funnel definitions for speed_read.
 * Events are stored in Supabase `analytics_events`.
 * Use lib/analytics/funnel-metrics.sql for ready-to-run SQL queries.
 */

export const FUNNEL_STAGES = {
  landing: 'landing_page_view',
  readerStart: 'reading_session_started',
  paywall: 'upgrade_modal_viewed',
  checkout: ['checkout_started', 'checkout_started_monthly', 'checkout_started_lifetime'] as const,
  paid: 'checkout_completed',
} as const;

export const FUNNEL_RATIOS = [
  {
    name: 'Landing → Reader Start',
    numerator: FUNNEL_STAGES.readerStart,
    denominator: FUNNEL_STAGES.landing,
    formula: 'reading_session_started / landing_page_view',
  },
  {
    name: 'Reader Start → Paywall',
    numerator: FUNNEL_STAGES.paywall,
    denominator: FUNNEL_STAGES.readerStart,
    formula: 'upgrade_modal_viewed / reading_session_started',
  },
  {
    name: 'Paywall → Checkout',
    numerator: 'checkout_started (or monthly + lifetime)',
    denominator: FUNNEL_STAGES.paywall,
    formula: 'checkout_started / upgrade_modal_viewed',
  },
  {
    name: 'Checkout → Paid',
    numerator: FUNNEL_STAGES.paid,
    denominator: 'checkout_started (or monthly + lifetime)',
    formula: 'checkout_completed / checkout_started',
  },
  {
    name: 'Visitor → Paid',
    numerator: FUNNEL_STAGES.paid,
    denominator: FUNNEL_STAGES.landing,
    formula: 'checkout_completed / landing_page_view',
  },
] as const;

export function conversionRate(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return numerator / denominator;
}

export function conversionPercent(numerator: number, denominator: number): number | null {
  const rate = conversionRate(numerator, denominator);
  if (rate === null) return null;
  return Math.round(rate * 10000) / 100;
}
