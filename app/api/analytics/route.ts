import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { AnalyticsEventName } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventName = body.eventName as AnalyticsEventName;
    const properties = body.properties ?? {};

    if (!eventName) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const service = createServiceClient();
    await service.from('analytics_events').insert({
      user_id: user?.id ?? null,
      event_name: eventName,
      properties,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
