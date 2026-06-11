import type { AnalyticsEventName } from '../types';
import { getAnalyticsAdapter } from './adapter';

export { getAnalyticsAdapter, setAnalyticsAdapter } from './adapter';
export type { AnalyticsAdapter } from './adapter';
export { supabaseAnalyticsAdapter } from './adapters/supabase';

export function trackEvent(
  eventName: AnalyticsEventName,
  properties: Record<string, unknown> = {}
): void {
  getAnalyticsAdapter().track(eventName, properties);
}
