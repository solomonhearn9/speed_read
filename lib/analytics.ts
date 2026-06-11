import type { AnalyticsEventName } from './types';

export function trackEvent(
  eventName: AnalyticsEventName,
  properties: Record<string, unknown> = {}
): void {
  try {
    // Fire-and-forget — never block the app
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, properties }),
    }).catch(() => {});
  } catch {
    // Silently ignore analytics failures
  }
}
