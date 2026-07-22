/**
 * Content access model for Reader's Journey levels and Story Adventure chapters.
 *
 * 1 = free (anonymous OK)
 * 2 = signup (free account)
 * 3+ = subscription (current Pro boundary)
 */
export type AccessTier = 'free' | 'signup' | 'subscription';

export type AccessGateError = 'signup_required' | 'subscription_required';

/** Default tiers by entry number when DB `access_tier` is unset. */
export function getAccessTierForEntry(levelOrChapterNumber: number): AccessTier {
  if (levelOrChapterNumber <= 1) return 'free';
  if (levelOrChapterNumber === 2) return 'signup';
  return 'subscription';
}

/** Prefer explicit content field; fall back to number-based defaults. */
export function resolveAccessTier(
  levelOrChapterNumber: number,
  explicit?: AccessTier | string | null
): AccessTier {
  if (explicit === 'free' || explicit === 'signup' || explicit === 'subscription') {
    return explicit;
  }
  return getAccessTierForEntry(levelOrChapterNumber);
}

export function canAccessEntry(
  tier: AccessTier,
  isLoggedIn: boolean,
  isPaid: boolean
): true | AccessGateError {
  if (tier === 'free') return true;
  if (tier === 'signup') return isLoggedIn ? true : 'signup_required';
  return isPaid ? true : 'subscription_required';
}

export function mapEntryAccessError(
  levelOrChapterNumber: number,
  isLoggedIn: boolean,
  isPaid: boolean,
  explicitTier?: AccessTier | string | null
): AccessGateError | null {
  const tier = resolveAccessTier(levelOrChapterNumber, explicitTier);
  const result = canAccessEntry(tier, isLoggedIn, isPaid);
  return result === true ? null : result;
}

export function getLockedNodeLabel(tier: AccessTier): string {
  if (tier === 'signup') return 'Sign up free to continue';
  if (tier === 'subscription') return 'Subscribe to continue — from $4.99/mo';
  return 'Locked';
}

/** Gate shown after finishing an entry, based on the *next* entry's tier. */
export function getContinueGate(
  nextEntryNumber: number | null,
  isLoggedIn: boolean,
  isPaid: boolean,
  nextExplicitTier?: AccessTier | string | null
): 'none' | 'signup' | 'subscription' {
  if (nextEntryNumber == null) return 'none';
  const err = mapEntryAccessError(nextEntryNumber, isLoggedIn, isPaid, nextExplicitTier);
  if (err === 'signup_required') return 'signup';
  if (err === 'subscription_required') return 'subscription';
  return 'none';
}
