import Clarity from '@microsoft/clarity';
import { getAttributionProperties } from './attribution';
import { deriveUserType, getSessionFlags } from './session-flags';
import { getAnalyticsContext } from './context';

let clarityReady = false;

export function setClarityReady(ready: boolean): void {
  clarityReady = ready;
}

function tagValue(value: unknown): string {
  if (value === null || value === undefined) return 'none';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

export function applyClarityTag(key: string, value: unknown): void {
  if (!clarityReady || typeof window === 'undefined') return;
  try {
    Clarity.setTag(key, tagValue(value));
  } catch {
    // Non-blocking
  }
}

export function syncClarityTagsFromProperties(
  eventName: string,
  properties: Record<string, unknown> = {}
): void {
  if (!clarityReady) return;

  const context = getAnalyticsContext();
  const flags = getSessionFlags();
  const attribution = getAttributionProperties();

  applyClarityTag('user_type', deriveUserType(context.is_logged_in, context.plan_status));
  applyClarityTag('challenge_completed', flags.challenge_completed);
  applyClarityTag('training_user', flags.training_user);
  applyClarityTag('adventure_user', flags.adventure_user);

  if (properties.chapter_number !== undefined) {
    applyClarityTag('chapter_number', properties.chapter_number);
  }
  if (properties.story_slug !== undefined) {
    applyClarityTag('story_slug', properties.story_slug);
  }

  applyClarityTag('utm_source', attribution.utm_source ?? properties.utm_source);
  applyClarityTag('utm_medium', attribution.utm_medium ?? properties.utm_medium);
  applyClarityTag('utm_campaign', attribution.utm_campaign ?? properties.utm_campaign);
  applyClarityTag('utm_content', attribution.utm_content ?? properties.utm_content);
  applyClarityTag('source_platform', attribution.source_platform ?? properties.source_platform);

  applyClarityTag('last_event', eventName);
}

export function applyInitialClarityTags(): void {
  if (!clarityReady) return;
  const attribution = getAttributionProperties();
  const context = getAnalyticsContext();
  const flags = getSessionFlags();

  applyClarityTag('user_type', deriveUserType(context.is_logged_in, context.plan_status));
  applyClarityTag('challenge_completed', flags.challenge_completed);
  applyClarityTag('training_user', flags.training_user);
  applyClarityTag('adventure_user', flags.adventure_user);
  applyClarityTag('utm_source', attribution.utm_source);
  applyClarityTag('utm_medium', attribution.utm_medium);
  applyClarityTag('utm_campaign', attribution.utm_campaign);
  applyClarityTag('utm_content', attribution.utm_content);
  applyClarityTag('source_platform', attribution.source_platform);
}
