export type PlanStatus = 'free' | 'monthly' | 'lifetime';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | null;

export type UserTier = 'anonymous' | 'free' | 'paid';

export interface Profile {
  id: string;
  email: string;
  plan_status: PlanStatus;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  lifetime_purchase: boolean;
  subscription_cancel_at_period_end?: boolean;
  subscription_current_period_end?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageInfo {
  tier: UserTier;
  sessionsUsed: number;
  sessionsLimit: number;
  wordLimit: number;
  canUpload: boolean;
  canScrape: boolean;
  isUnlimited: boolean;
}

export type AnalyticsEventName =
  | 'landing_page_view'
  | 'paste_text_started'
  | 'start_reading_clicked'
  | 'reading_session_started'
  | 'reading_session_completed'
  | 'signup_clicked'
  | 'login_clicked'
  | 'signup_completed'
  | 'upgrade_modal_viewed'
  | 'checkout_started'
  | 'checkout_started_monthly'
  | 'checkout_started_lifetime'
  | 'checkout_completed'
  | 'upload_gate_viewed'
  | 'url_gate_viewed'
  | 'word_limit_hit'
  | 'session_limit_hit'
  | 'share_clicked'
  | 'copy_link_clicked'
  | 'pricing_page_viewed'
  | 'pricing_monthly_selected'
  | 'pricing_lifetime_selected'
  | 'verification_email_sent'
  | 'verification_email_resent'
  | 'verification_completed'
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'file_upload_attempted'
  | 'url_scrape_attempted'
  | 'invite_modal_viewed'
  | 'invite_sent'
  | 'referral_link_copied';
