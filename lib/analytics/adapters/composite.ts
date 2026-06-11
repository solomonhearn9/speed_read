import type { AnalyticsEventName } from '@/lib/types';
import type { AnalyticsAdapter } from '../adapter';

export function createCompositeAdapter(adapters: AnalyticsAdapter[]): AnalyticsAdapter {
  return {
    track(eventName: AnalyticsEventName, properties: Record<string, unknown> = {}): void {
      for (const adapter of adapters) {
        try {
          adapter.track(eventName, properties);
        } catch {
          // Never block the app on analytics failures
        }
      }
    },
  };
}
