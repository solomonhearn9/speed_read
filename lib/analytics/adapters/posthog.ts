/**
 * Future PostHog adapter — enable by installing posthog-js and swapping the
 * active adapter in lib/analytics/adapter.ts:
 *
 *   import { posthogAnalyticsAdapter } from './adapters/posthog';
 *   setAnalyticsAdapter(posthogAnalyticsAdapter);
 *
 * Requires: NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST
 */

import type { AnalyticsEventName } from '@/lib/types';
import type { AnalyticsAdapter } from '../adapter';

export const posthogAnalyticsAdapter: AnalyticsAdapter = {
  track(eventName: AnalyticsEventName, properties: Record<string, unknown> = {}): void {
    // Uncomment after installing posthog-js:
    //
    // import posthog from 'posthog-js';
    // posthog.capture(eventName, properties);

    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics:posthog-stub]', eventName, properties);
    }
  },
};
