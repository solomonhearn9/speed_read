import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getUserTier } from '@/lib/plans';
import type { Profile } from '@/lib/types';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ sessionsUsed: 0, profile: null });
    }

    const service = createServiceClient();
    const { data: profile } = await service
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await service
      .from('daily_session_usage')
      .select('session_count')
      .eq('user_id', user.id)
      .eq('session_date', today)
      .single();

    const tier = getUserTier(true, profile as Profile | null);
    const sessionsUsed = tier === 'paid' ? 0 : (usage?.session_count ?? 0);

    return NextResponse.json({
      sessionsUsed,
      profile: profile ?? null,
    });
  } catch {
    return NextResponse.json({ sessionsUsed: 0, profile: null });
  }
}
