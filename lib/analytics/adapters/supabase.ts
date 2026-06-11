import type { AnalyticsEventName } from '@/lib/types';
import type { AnalyticsAdapter } from '../adapter';

export const supabaseAnalyticsAdapter: AnalyticsAdapter = {
  track(eventName: AnalyticsEventName, properties: Record<string, unknown>): void {
    try {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, properties }),
      }).catch(() => {});
    } catch {
      // Never block the app on analytics failures
    }
  },
};
