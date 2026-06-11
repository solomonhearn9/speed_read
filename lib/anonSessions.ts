const ANON_SESSIONS_KEY = 'speed-reader-anon-sessions';

export function getAnonSessionCount(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(ANON_SESSIONS_KEY) || '0', 10);
}

export function incrementAnonSessionCount(): number {
  const count = getAnonSessionCount() + 1;
  localStorage.setItem(ANON_SESSIONS_KEY, String(count));
  return count;
}
