import type { AnalyticsEventName } from '@/lib/types';
import { supabaseAnalyticsAdapter } from './adapters/supabase';

export interface AnalyticsAdapter {
  track(eventName: AnalyticsEventName, properties?: Record<string, unknown>): void;
}

/**
 * Swap this adapter to enable PostHog (or another provider) without changing call sites.
 * Example future adapter: lib/analytics/adapters/posthog.ts
 */
let activeAdapter: AnalyticsAdapter = supabaseAnalyticsAdapter;

export function getAnalyticsAdapter(): AnalyticsAdapter {
  return activeAdapter;
}

export function setAnalyticsAdapter(adapter: AnalyticsAdapter): void {
  activeAdapter = adapter;
}
