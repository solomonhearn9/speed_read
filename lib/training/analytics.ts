import { trackEvent } from '@/lib/analytics';
import type { AnalyticsEventName } from '@/lib/types';
import { getProdPlanLabel } from '@/lib/plans';
import type { Profile } from '@/lib/types';

export function trainingAnalyticsProps(
  profile: Profile | null,
  isLoggedIn: boolean,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    user_plan: isLoggedIn ? (getProdPlanLabel(isLoggedIn, profile) ?? 'Free') : 'Anonymous',
    ...extra,
  };
}

export function trackTrainingEvent(
  event: AnalyticsEventName,
  profile: Profile | null,
  isLoggedIn: boolean,
  props: Record<string, unknown> = {}
): void {
  trackEvent(event, trainingAnalyticsProps(profile, isLoggedIn, props));
}
