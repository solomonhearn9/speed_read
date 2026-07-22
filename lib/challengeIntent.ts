export const CHALLENGE_INTENT_STORAGE_KEY = 'speed-reader-challenge-intent';

export const CHALLENGE_INTENT_IDS = [
  'saw_video',
  'trouble_focusing',
  'read_more',
  'for_kid',
  'student',
] as const;

export type ChallengeIntentId = (typeof CHALLENGE_INTENT_IDS)[number];

export interface ChallengeIntentCta {
  label: string;
  href: string;
  /** Analytics destination key for validating the router mapping. */
  destination: string;
}

/**
 * Router answer → single primary CTA. Extend this lookup to add intents later.
 */
export const CHALLENGE_INTENT_CTA_MAP: Record<ChallengeIntentId, ChallengeIntentCta> = {
  saw_video: {
    label: 'Start your streak',
    href: '/train',
    destination: 'daily_challenge_streak',
  },
  trouble_focusing: {
    label: 'Try Focus Canyon',
    href: '/train',
    destination: 'adult_journey_ch1',
  },
  read_more: {
    label: "Start the Reader's Journey",
    href: '/train',
    destination: 'adult_journey_ch1',
  },
  for_kid: {
    label: 'Start the Adventure',
    href: '/adventures',
    destination: 'kids_adventure_ch1',
  },
  student: {
    label: "Start the Reader's Journey",
    href: '/train',
    destination: 'adult_journey_ch1',
  },
};

export const DEFAULT_CHALLENGE_CTA: ChallengeIntentCta = {
  label: 'Continue Learning',
  href: '/train',
  destination: 'adult_journey_ch1_default',
};

export function isChallengeIntentId(value: string): value is ChallengeIntentId {
  return (CHALLENGE_INTENT_IDS as readonly string[]).includes(value);
}

export function getChallengeCtaForIntent(intent: string | null | undefined): ChallengeIntentCta {
  if (intent && isChallengeIntentId(intent)) {
    return CHALLENGE_INTENT_CTA_MAP[intent];
  }
  return DEFAULT_CHALLENGE_CTA;
}

export function loadStoredChallengeIntent(): ChallengeIntentId | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(CHALLENGE_INTENT_STORAGE_KEY);
  return raw && isChallengeIntentId(raw) ? raw : null;
}

export function persistChallengeIntentLocal(intent: ChallengeIntentId): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHALLENGE_INTENT_STORAGE_KEY, intent);
}

/** Persist for anon (localStorage) and signed-in users (profile API). */
export async function persistChallengeIntent(
  intent: ChallengeIntentId,
  isLoggedIn: boolean
): Promise<void> {
  persistChallengeIntentLocal(intent);
  if (!isLoggedIn) return;
  try {
    await fetch('/api/profile/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_intent: intent }),
    });
  } catch {
    // localStorage already saved; profile sync is best-effort
  }
}
