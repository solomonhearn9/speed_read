import type { SupabaseClient } from '@supabase/supabase-js';
import { isPaidProfile } from '@/lib/plans';
import type { Profile } from '@/lib/types';
import {
  getAccessTierForEntry,
  mapEntryAccessError,
  type AccessGateError,
} from '@/lib/accessTier';

const PAID_PROFILE_FIELDS =
  'plan_status, subscription_status, lifetime_purchase' as const;

/** @deprecated Prefer getAccessTierForEntry — kept for map defaults. */
export const PRO_SUBSCRIPTION_LEVEL_THRESHOLD = 3;

export async function fetchIsPaidProfile(
  service: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profile } = await service
    .from('profiles')
    .select(PAID_PROFILE_FIELDS)
    .eq('id', userId)
    .single();

  return isPaidProfile(profile as Profile | null);
}

export function requiresSubscriptionForMapEntry(levelOrChapterNumber: number): boolean {
  return getAccessTierForEntry(levelOrChapterNumber) === 'subscription';
}

/**
 * @deprecated Use mapEntryAccessError with isLoggedIn for signup vs subscription.
 * Kept for call sites that only check paid status after auth.
 */
export function mapEntrySubscriptionError(
  levelOrChapterNumber: number,
  isPaid: boolean
): 'subscription_required' | null {
  if (requiresSubscriptionForMapEntry(levelOrChapterNumber) && !isPaid) {
    return 'subscription_required';
  }
  return null;
}

export function checkMapEntryAccess(
  levelOrChapterNumber: number,
  isLoggedIn: boolean,
  isPaid: boolean,
  explicitTier?: string | null
): AccessGateError | null {
  return mapEntryAccessError(levelOrChapterNumber, isLoggedIn, isPaid, explicitTier);
}
