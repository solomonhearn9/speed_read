import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface AttributionPayload {
  first_utm_source?: string | null;
  first_utm_medium?: string | null;
  first_utm_campaign?: string | null;
  first_utm_content?: string | null;
  first_referrer?: string | null;
  first_landing_path?: string | null;
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const body = (await request.json()) as AttributionPayload;
    const service = createServiceClient();

    const { data: profile } = await service
      .from('profiles')
      .select(
        'first_utm_source, first_utm_medium, first_utm_campaign, first_utm_content, first_referrer, first_landing_path'
      )
      .eq('id', user.id)
      .single();

    const updates: Record<string, string> = {};
    const fields = [
      'first_utm_source',
      'first_utm_medium',
      'first_utm_campaign',
      'first_utm_content',
      'first_referrer',
      'first_landing_path',
    ] as const;

    for (const field of fields) {
      const existing = profile?.[field];
      const incoming = body[field];
      if (!existing && incoming) {
        updates[field] = incoming;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const { error } = await service
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('[analytics] Attribution update failed', { userId: user.id, error: error.message });
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[analytics] Attribution request failed', err);
    return NextResponse.json({ ok: true });
  }
}
