import { getOrCreateAnonId } from '@/lib/anonId';
import posthog from 'posthog-js';

let anonIdentified = false;
let anonMergedToUser: string | null = null;

export function ensureAnonPostHogIdentity(): string {
  const anonId = getOrCreateAnonId();
  if (typeof window === 'undefined' || !anonId) return anonId;

  if (!anonIdentified) {
    try {
      posthog.identify(anonId, { is_anonymous: true });
      anonIdentified = true;
    } catch {
      // Non-blocking
    }
  }
  return anonId;
}

export function mergeAnonIdentityOnSignup(userId: string): void {
  if (typeof window === 'undefined' || !userId || anonMergedToUser === userId) return;
  const anonId = getOrCreateAnonId();
  if (!anonId || anonId === userId) return;
  try {
    posthog.alias(userId, anonId);
    anonMergedToUser = userId;
  } catch {
    // Non-blocking
  }
}
