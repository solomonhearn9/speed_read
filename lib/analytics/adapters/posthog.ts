import posthog from 'posthog-js';
import type { AnalyticsEventName } from '@/lib/types';
import type { AnalyticsAdapter } from '../adapter';

let initialized = false;

export function initPostHog(): boolean {
  if (typeof window === 'undefined') return false;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || initialized) return initialized;

  try {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      capture_pageview: false,
      persistence: 'localStorage',
      autocapture: false,
    });
    initialized = true;
  } catch {
    initialized = false;
  }

  return initialized;
}

export function identifyPostHogUser(
  userId: string,
  properties: Record<string, unknown>
): void {
  if (!initialized) return;
  try {
    posthog.identify(userId, properties);
  } catch {
    // Non-blocking
  }
}

export function resetPostHogUser(): void {
  if (!initialized) return;
  try {
    posthog.reset();
  } catch {
    // Non-blocking
  }
}

export const posthogAnalyticsAdapter: AnalyticsAdapter = {
  track(eventName: AnalyticsEventName, properties: Record<string, unknown> = {}): void {
    if (!initialized) return;
    try {
      posthog.capture(eventName, properties);
    } catch {
      // Non-blocking
    }
  },
};
