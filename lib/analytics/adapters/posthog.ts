import posthog from 'posthog-js';
import type { AnalyticsEventName } from '@/lib/types';
import type { AnalyticsAdapter } from '../adapter';
import { getAttributionProperties } from '../attribution';

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

/** Register first-touch UTMs as super properties on every subsequent PostHog event. */
export function registerPostHogAttribution(): void {
  if (!initialized) return;
  try {
    const attribution = getAttributionProperties();
    posthog.register({
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      source_platform: attribution.source_platform,
      content_id: attribution.content_id,
      landing_path: attribution.landing_path,
      referrer: attribution.referrer,
    });
  } catch {
    // Non-blocking
  }
}

export function identifyPostHogUser(
  userId: string,
  properties: Record<string, unknown>
): void {
  if (!initialized) return;
  try {
    const attribution = getAttributionProperties();
    posthog.identify(userId, {
      ...properties,
      first_utm_source: attribution.utm_source,
      first_utm_medium: attribution.utm_medium,
      first_utm_campaign: attribution.utm_campaign,
      first_utm_content: attribution.utm_content,
      first_source_platform: attribution.source_platform,
    });
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
