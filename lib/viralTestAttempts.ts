const VIRAL_TEST_ATTEMPTS_KEY = 'speed-reader-viral-test-attempts';

export const VIRAL_TEST_FREE_LIMIT = 3;

export function getViralTestAttemptCount(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(VIRAL_TEST_ATTEMPTS_KEY) || '0', 10);
}

export function incrementViralTestAttemptCount(): number {
  const count = getViralTestAttemptCount() + 1;
  localStorage.setItem(VIRAL_TEST_ATTEMPTS_KEY, String(count));
  return count;
}

export function canStartViralTest(isUnlimited: boolean): boolean {
  if (isUnlimited) return true;
  return getViralTestAttemptCount() < VIRAL_TEST_FREE_LIMIT;
}

export function getViralTestAttemptsRemaining(isUnlimited: boolean): number | null {
  if (isUnlimited) return null;
  return Math.max(0, VIRAL_TEST_FREE_LIMIT - getViralTestAttemptCount());
}
