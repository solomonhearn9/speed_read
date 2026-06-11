import type { Profile, UserTier, UsageInfo } from './types';

export const PLAN_LIMITS = {
  anonymous: {
    wordLimit: 500,
    sessionLimit: 3,
    canUpload: false,
    canScrape: false,
  },
  free: {
    wordLimit: 1500,
    sessionLimit: 5,
    canUpload: false,
    canScrape: false,
  },
  paid: {
    wordLimit: Infinity,
    sessionLimit: Infinity,
    canUpload: true,
    canScrape: true,
  },
} as const;

export function isPaidProfile(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.lifetime_purchase || profile.plan_status === 'lifetime') return true;
  if (profile.plan_status === 'monthly') {
    return profile.subscription_status === 'active' || profile.subscription_status === 'past_due';
  }
  return false;
}

export function getUserTier(isLoggedIn: boolean, profile: Profile | null): UserTier {
  if (!isLoggedIn) return 'anonymous';
  if (isPaidProfile(profile)) return 'paid';
  return 'free';
}

export function getUsageInfo(
  tier: UserTier,
  sessionsUsed: number
): UsageInfo {
  const limits = PLAN_LIMITS[tier];
  return {
    tier,
    sessionsUsed,
    sessionsLimit: limits.sessionLimit,
    wordLimit: limits.wordLimit,
    canUpload: limits.canUpload,
    canScrape: limits.canScrape,
    isUnlimited: tier === 'paid',
  };
}

export type DevPlanLabel = 'Anonymous' | 'Free' | 'Monthly' | 'Lifetime';
export type ProdPlanLabel = 'Free' | 'Pro' | 'Lifetime';

export function getDevPlanLabel(isLoggedIn: boolean, profile: Profile | null): DevPlanLabel {
  if (!isLoggedIn) return 'Anonymous';
  if (profile?.lifetime_purchase || profile?.plan_status === 'lifetime') return 'Lifetime';
  if (profile?.plan_status === 'monthly') return 'Monthly';
  return 'Free';
}

export function getProdPlanLabel(isLoggedIn: boolean, profile: Profile | null): ProdPlanLabel | null {
  if (!isLoggedIn) return null;
  if (profile?.lifetime_purchase || profile?.plan_status === 'lifetime') return 'Lifetime';
  if (isPaidProfile(profile)) return 'Pro';
  return 'Free';
}

export function getAccountPlanLabel(profile: Profile | null): string {
  if (!profile) return 'Free';
  if (profile.lifetime_purchase || profile.plan_status === 'lifetime') return 'Lifetime Access';
  if (profile.plan_status === 'monthly' && isPaidProfile(profile)) return 'Pro';
  return 'Free';
}

export function getCancelAtPeriodEndMessage(profile: Profile | null): string | null {
  if (!profile?.subscription_cancel_at_period_end || !profile.subscription_current_period_end) {
    return null;
  }
  const date = new Date(profile.subscription_current_period_end).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `Your Pro access remains active until ${date}.`;
}

export function getSessionLimitLabel(tier: UserTier, sessionsUsed: number, sessionsLimit: number): string {
  if (tier === 'paid') return 'Pro plan: unlimited sessions';
  if (tier === 'anonymous') {
    return `Free trial: ${sessionsUsed} of ${sessionsLimit} sessions used`;
  }
  return `Free plan: ${sessionsUsed} of ${sessionsLimit} sessions used today`;
}
