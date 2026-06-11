import type { AnalyticsEventName } from '../types';
import { getAnalyticsAdapter } from './adapter';
import { enrichEventProperties } from './context';

export { getAnalyticsAdapter, setAnalyticsAdapter } from './adapter';
export type { AnalyticsAdapter } from './adapter';
export { supabaseAnalyticsAdapter } from './adapters/supabase';
export { captureFirstTouchAttribution, getAttributionProperties } from './attribution';
export { setAnalyticsContext, getAnalyticsContext } from './context';
export { persistSignupAttribution } from './signup-attribution';

export function trackEvent(
  eventName: AnalyticsEventName,
  properties: Record<string, unknown> = {}
): void {
  const enriched = enrichEventProperties(eventName, properties);
  getAnalyticsAdapter().track(eventName, enriched);
}
