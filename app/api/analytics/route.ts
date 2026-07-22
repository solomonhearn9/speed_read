import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isValidAnalyticsEventName } from '@/lib/analytics/event-names';

export const dynamic = 'force-dynamic';

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_EVENTS_PER_WINDOW = 120;
const rateLimitBuckets = new Map<string, number[]>();

function getClientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function isRateLimited(key: string, eventCount: number): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimitBuckets.get(key) ?? []).filter((t) => t > windowStart);
  if (timestamps.length + eventCount > MAX_EVENTS_PER_WINDOW) {
    rateLimitBuckets.set(key, timestamps);
    return true;
  }
  for (let i = 0; i < eventCount; i++) timestamps.push(now);
  rateLimitBuckets.set(key, timestamps);
  return false;
}

interface AnalyticsPayload {
  eventName: string;
  properties?: Record<string, unknown>;
}

function normalizePayload(body: unknown): AnalyticsPayload[] {
  if (!body || typeof body !== 'object') return [];
  const record = body as Record<string, unknown>;

  if (Array.isArray(record.events)) {
    return record.events
      .filter((e): e is AnalyticsPayload => {
        return !!e && typeof e === 'object' && typeof (e as AnalyticsPayload).eventName === 'string';
      })
      .slice(0, 25);
  }

  if (typeof record.eventName === 'string') {
    return [{ eventName: record.eventName, properties: (record.properties as Record<string, unknown>) ?? {} }];
  }

  return [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payloads = normalizePayload(body);

    if (payloads.length === 0) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const validPayloads = payloads.filter((p) => isValidAnalyticsEventName(p.eventName));
    if (validPayloads.length === 0) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const clientKey = getClientKey(request);
    if (isRateLimited(clientKey, validPayloads.length)) {
      return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const service = createServiceClient();

    const rows = validPayloads.map((p) => ({
      user_id: user?.id ?? null,
      event_name: p.eventName,
      properties: p.properties ?? {},
    }));

    const { error } = await service.from('analytics_events').insert(rows);

    if (error) {
      console.error('[analytics] Insert failed', { error: error.message });
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: rows.length });
  } catch (err) {
    console.error('[analytics] Request failed', err);
    return NextResponse.json({ ok: true });
  }
}
