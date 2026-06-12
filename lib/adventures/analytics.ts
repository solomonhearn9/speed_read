import { trackEvent } from '@/lib/analytics';
import type { AnalyticsEventName } from '@/lib/types';
import { getProdPlanLabel } from '@/lib/plans';
import type { Profile } from '@/lib/types';

export function adventureAnalyticsProps(
  profile: Profile | null,
  isLoggedIn: boolean,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    user_plan: isLoggedIn ? (getProdPlanLabel(isLoggedIn, profile) ?? 'Free') : 'Anonymous',
    is_logged_in: isLoggedIn,
    ...extra,
  };
}

export function trackAdventureEvent(
  event: AnalyticsEventName,
  profile: Profile | null,
  isLoggedIn: boolean,
  props: Record<string, unknown> = {}
): void {
  trackEvent(event, adventureAnalyticsProps(profile, isLoggedIn, props));
}
