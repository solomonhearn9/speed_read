import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getUserTier, PLAN_LIMITS } from '@/lib/plans';
import type { Profile } from '@/lib/types';

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: true, tier: 'anonymous' });
    }

    const service = createServiceClient();
    const { data: profile } = await service
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const typedProfile = profile as Profile | null;
    const tier = getUserTier(true, typedProfile);

    if (tier === 'paid') {
      return NextResponse.json({ ok: true, tier: 'paid' });
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await service
      .from('daily_session_usage')
      .select('session_count')
      .eq('user_id', user.id)
      .eq('session_date', today)
      .single();

    const currentCount = existing?.session_count ?? 0;
    const limit = PLAN_LIMITS.free.sessionLimit;

    if (currentCount >= limit) {
      return NextResponse.json(
        { ok: false, error: 'session_limit', sessionsUsed: currentCount, sessionsLimit: limit },
        { status: 403 }
      );
    }

    const newCount = currentCount + 1;
    await service.from('daily_session_usage').upsert(
      { user_id: user.id, session_date: today, session_count: newCount },
      { onConflict: 'user_id,session_date' }
    );

    return NextResponse.json({
      ok: true,
      tier: 'free',
      sessionsUsed: newCount,
      sessionsLimit: limit,
    });
  } catch {
    return NextResponse.json({ ok: true, tier: 'anonymous' });
  }
}
