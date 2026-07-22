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
  first_utm_source?: string | null;
  first_utm_medium?: string | null;
  first_utm_campaign?: string | null;
  first_utm_content?: string | null;
  first_referrer?: string | null;
  first_landing_path?: string | null;
  total_xp?: number;
  reader_level?: number;
  current_streak?: number;
  longest_streak?: number;
  last_training_date?: string | null;
  challenge_intent?: string | null;
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
  | 'challenge_started'
  | 'challenge_completed'
  | 'challenge_quiz_started'
  | 'challenge_quiz_completed'
  | 'challenge_intent_selected'
  | 'challenge_intent_cta_clicked'
  | 'chapter_1_complete'
  | 'signup_prompt_shown'
  | 'signup_complete'
  | 'subscription_prompt_shown'
  | 'subscription_complete'
  | 'app_returned'
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
  | 'paid_user_created'
  | 'upload_gate_viewed'
  | 'url_gate_viewed'
  | 'word_limit_hit'
  | 'session_limit_hit'
  | 'challenge_limit_hit'
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
  | 'referral_link_copied'
  | 'viral_test_started'
  | 'viral_test_completed'
  | 'viral_test_shared'
  | 'training_path_viewed'
  | 'training_level_viewed'
  | 'training_level_started'
  | 'training_level_completed'
  | 'quiz_started'
  | 'quiz_question_answered'
  | 'quiz_completed'
  | 'xp_awarded'
  | 'reader_level_up'
  | 'tier_unlocked'
  | 'personal_best_set'
  | 'retry_level_clicked'
  | 'continue_with_low_score_clicked'
  | 'adventures_home_viewed'
  | 'adventure_story_viewed'
  | 'adventure_chapter_viewed'
  | 'adventure_chapter_started'
  | 'adventure_chapter_completed'
  | 'adventure_quiz_started'
  | 'adventure_quiz_question_answered'
  | 'adventure_quiz_completed'
  | 'adventure_xp_awarded'
  | 'adventure_next_chapter_clicked'
  | 'adventure_retry_clicked'
  | 'adventure_signup_prompt_viewed'
  | 'adventure_signup_clicked'
  | 'adventure_story_completed'
  | 'chapter_abandoned';
