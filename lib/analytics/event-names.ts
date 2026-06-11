import type { AnalyticsEventName } from '../types';

export const ANALYTICS_EVENT_NAMES: readonly AnalyticsEventName[] = [
  'landing_page_view',
  'paste_text_started',
  'start_reading_clicked',
  'reading_session_started',
  'reading_session_completed',
  'signup_clicked',
  'login_clicked',
  'signup_completed',
  'upgrade_modal_viewed',
  'checkout_started',
  'checkout_started_monthly',
  'checkout_started_lifetime',
  'checkout_completed',
  'upload_gate_viewed',
  'url_gate_viewed',
  'word_limit_hit',
  'session_limit_hit',
  'share_clicked',
  'copy_link_clicked',
  'pricing_page_viewed',
  'pricing_monthly_selected',
  'pricing_lifetime_selected',
  'verification_email_sent',
  'verification_email_resent',
  'verification_completed',
  'login_success',
  'login_failed',
  'logout',
  'file_upload_attempted',
  'url_scrape_attempted',
  'invite_modal_viewed',
  'invite_sent',
  'referral_link_copied',
  'viral_test_started',
  'viral_test_completed',
  'viral_test_shared',
] as const;

export function isValidAnalyticsEventName(name: string): name is AnalyticsEventName {
  return (ANALYTICS_EVENT_NAMES as readonly string[]).includes(name);
}
