import type { AnalyticsEventName } from '@/lib/types';
import type { AnalyticsAdapter } from '../adapter';

interface QueuedEvent {
  eventName: AnalyticsEventName;
  properties: Record<string, unknown>;
}

const FLUSH_INTERVAL_MS = 5000;
const MAX_BATCH_SIZE = 25;

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersAttached = false;

function flushQueue(): void {
  if (queue.length === 0) return;

  const batch = queue.splice(0, MAX_BATCH_SIZE);
  const remaining = queue.length > 0;

  try {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: batch.map((e) => ({ eventName: e.eventName, properties: e.properties })),
      }),
    }).catch(() => {});

    if (remaining) {
      scheduleFlush(0);
    }
  } catch {
    // Never block the app on analytics failures
  }
}

function scheduleFlush(delayMs = FLUSH_INTERVAL_MS): void {
  if (typeof window === 'undefined') return;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushQueue();
  }, delayMs);
}

function attachFlushListeners(): void {
  if (listenersAttached || typeof window === 'undefined') return;
  listenersAttached = true;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushQueue();
  });
  window.addEventListener('pagehide', () => flushQueue());
}

export const supabaseAnalyticsAdapter: AnalyticsAdapter = {
  track(eventName: AnalyticsEventName, properties: Record<string, unknown>): void {
    attachFlushListeners();
    queue.push({ eventName, properties });
    if (queue.length >= MAX_BATCH_SIZE) {
      flushQueue();
    } else {
      scheduleFlush();
    }
  },
};

/** Flush pending analytics immediately (for tests). */
export function flushSupabaseAnalyticsQueue(): void {
  flushQueue();
}
