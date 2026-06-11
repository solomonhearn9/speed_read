import type { AnalyticsEventName } from '@/lib/types';
import { createCompositeAdapter } from './adapters/composite';
import { posthogAnalyticsAdapter } from './adapters/posthog';
import { supabaseAnalyticsAdapter } from './adapters/supabase';

export interface AnalyticsAdapter {
  track(eventName: AnalyticsEventName, properties?: Record<string, unknown>): void;
}

let activeAdapter: AnalyticsAdapter = createCompositeAdapter([
  supabaseAnalyticsAdapter,
  posthogAnalyticsAdapter,
]);

export function getAnalyticsAdapter(): AnalyticsAdapter {
  return activeAdapter;
}

export function setAnalyticsAdapter(adapter: AnalyticsAdapter): void {
  activeAdapter = adapter;
}
