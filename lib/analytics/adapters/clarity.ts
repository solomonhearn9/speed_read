import Clarity from '@microsoft/clarity';
import type { AnalyticsEventName } from '@/lib/types';
import type { AnalyticsAdapter } from '../adapter';
import { syncClarityTagsFromProperties } from '../clarity-tags';

export const clarityAnalyticsAdapter: AnalyticsAdapter = {
  track(eventName: AnalyticsEventName, properties: Record<string, unknown> = {}): void {
    if (typeof window === 'undefined') return;
    try {
      Clarity.event(eventName);
      syncClarityTagsFromProperties(eventName, properties);
    } catch {
      // Non-blocking
    }
  },
};
