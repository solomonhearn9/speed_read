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
  | 'checkout_started_monthly'
  | 'checkout_started_lifetime'
  | 'checkout_completed'
  | 'upload_gate_viewed'
  | 'url_gate_viewed'
  | 'word_limit_hit'
  | 'session_limit_hit';
