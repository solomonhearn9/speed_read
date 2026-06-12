import type { SupabaseClient } from '@supabase/supabase-js';
import { isPaidProfile } from '@/lib/plans';
import type { Profile } from '@/lib/types';

const PAID_PROFILE_FIELDS =
  'plan_status, subscription_status, lifetime_purchase' as const;

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

/** First map level/chapter is subscription-only for all users. */
export function requiresSubscriptionForMapEntry(levelOrChapterNumber: number): boolean {
  return levelOrChapterNumber === 1;
}

export function mapEntrySubscriptionError(
  levelOrChapterNumber: number,
  isPaid: boolean
): 'subscription_required' | null {
  if (requiresSubscriptionForMapEntry(levelOrChapterNumber) && !isPaid) {
    return 'subscription_required';
  }
  return null;
}
