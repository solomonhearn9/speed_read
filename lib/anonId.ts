const ANON_ID_KEY = 'speedread_anon_id';

function generateAnonId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `anon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function getOrCreateAnonId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = generateAnonId();
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

export function getAnonId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ANON_ID_KEY);
}
