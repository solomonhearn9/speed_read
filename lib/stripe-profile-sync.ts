import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import type { PlanStatus, Profile, SubscriptionStatus } from './types';

export function isLifetimeProfile(profile: Pick<Profile, 'lifetime_purchase' | 'plan_status'> | null): boolean {
  if (!profile) return false;
  return profile.lifetime_purchase || profile.plan_status === 'lifetime';
}

export function mapSubscriptionStatus(stripeStatus: string): SubscriptionStatus | null {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
    trialing: 'active',
    paused: 'past_due',
  };
  return statusMap[stripeStatus] ?? null;
}

export function planStatusFromSubscription(stripeStatus: string): PlanStatus {
  const retainAccessStatuses = new Set(['active', 'past_due', 'trialing', 'paused']);
  return retainAccessStatuses.has(stripeStatus) ? 'monthly' : 'free';
}

export function getSubscriptionBillingFields(subscription: Stripe.Subscription): {
  subscription_cancel_at_period_end: boolean;
  subscription_current_period_end: string | null;
} {
  const rawPeriodEnd = (subscription as Stripe.Subscription & { current_period_end?: number })
    .current_period_end;
  return {
    subscription_cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    subscription_current_period_end: rawPeriodEnd
      ? new Date(rawPeriodEnd * 1000).toISOString()
      : null,
  };
}

export function canAccessBillingPortal(
  profile: Pick<
    Profile,
    | 'stripe_customer_id'
    | 'plan_status'
    | 'subscription_status'
    | 'lifetime_purchase'
  > | null
): boolean {
  if (!profile?.stripe_customer_id) return false;
  if (isLifetimeProfile(profile)) return false;
  if (profile.plan_status !== 'monthly') return false;
  return profile.subscription_status === 'active' || profile.subscription_status === 'past_due';
}

export async function updateProfile(
  service: SupabaseClient,
  userId: string,
  updates: Partial<Profile>,
  context: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await service
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error(`[stripe] Profile update failed (${context})`, {
      userId,
      error: error.message,
    });
    return { ok: false, error: error.message };
  }

  console.info(`[stripe] Profile updated (${context})`, {
    userId,
    fields: Object.keys(updates),
  });
  return { ok: true };
}
