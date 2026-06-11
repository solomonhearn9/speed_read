import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isValidAnalyticsEventName } from '@/lib/analytics/event-names';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventName = body.eventName as string;
    const properties = body.properties ?? {};

    if (!eventName || !isValidAnalyticsEventName(eventName)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const service = createServiceClient();
    const { error } = await service.from('analytics_events').insert({
      user_id: user?.id ?? null,
      event_name: eventName,
      properties,
    });

    if (error) {
      console.error('[analytics] Insert failed', { eventName, error: error.message });
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[analytics] Request failed', err);
    return NextResponse.json({ ok: true });
  }
}
