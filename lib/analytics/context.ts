import type { PlanStatus } from '@/lib/types';
import { getAttributionProperties } from './attribution';
import { getDeviceType } from './device';
import { deriveUserType, getSessionFlags } from './session-flags';

export interface AnalyticsContext {
  is_logged_in: boolean;
  plan_status: PlanStatus | 'anonymous';
  user_id: string | null;
}

let analyticsContext: AnalyticsContext = {
  is_logged_in: false,
  plan_status: 'anonymous',
  user_id: null,
};

export function setAnalyticsContext(context: Partial<AnalyticsContext>): void {
  analyticsContext = { ...analyticsContext, ...context };
}

export function getAnalyticsContext(): AnalyticsContext {
  return analyticsContext;
}

const LIMIT_TYPE_BY_EVENT: Partial<Record<string, string>> = {
  word_limit_hit: 'word',
  session_limit_hit: 'session',
  upload_gate_viewed: 'upload',
  url_gate_viewed: 'url',
  challenge_limit_hit: 'challenge',
};

export function enrichEventProperties(
  eventName: string,
  properties: Record<string, unknown> = {}
): Record<string, unknown> {
  const context = getAnalyticsContext();
  const attribution = getAttributionProperties();

  const flags = getSessionFlags();
  const userType = deriveUserType(context.is_logged_in, context.plan_status);

  const enriched: Record<string, unknown> = {
    ...attribution,
    is_logged_in: context.is_logged_in,
    plan_status: context.plan_status,
    user_type: userType,
    user_plan: properties.user_plan ?? userType,
    challenge_completed: flags.challenge_completed,
    training_user: flags.training_user,
    adventure_user: flags.adventure_user,
    device_type: getDeviceType(),
    ...properties,
  };

  if (!enriched.limit_type && LIMIT_TYPE_BY_EVENT[eventName]) {
    enriched.limit_type = LIMIT_TYPE_BY_EVENT[eventName];
  }

  if (
    (eventName === 'checkout_started' ||
      eventName === 'checkout_started_monthly' ||
      eventName === 'checkout_started_lifetime' ||
      eventName === 'checkout_completed' ||
      eventName === 'paid_user_created') &&
    !enriched.checkout_type
  ) {
    const priceType = properties.priceType ?? properties.checkout_type;
    if (priceType === 'monthly' || priceType === 'lifetime') {
      enriched.checkout_type = priceType;
    }
  }

  return enriched;
}
