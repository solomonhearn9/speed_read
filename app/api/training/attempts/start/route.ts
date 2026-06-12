import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { ANONYMOUS_PREVIEW_LEVEL_SLUG } from '@/lib/training/constants';

export async function POST(request: Request) {
  try {
    const { level_id: levelId } = await request.json();
    if (!levelId) {
      return NextResponse.json({ error: 'level_id_required' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const service = createServiceClient();

    const { data: level } = await service
      .from('training_levels')
      .select('id, passage_id, target_wpm, slug')
      .eq('id', levelId)
      .maybeSingle();

    if (!level) {
      return NextResponse.json({ error: 'level_not_found' }, { status: 404 });
    }

    if (!user && level.slug !== ANONYMOUS_PREVIEW_LEVEL_SLUG) {
      return NextResponse.json({ error: 'auth_required' }, { status: 401 });
    }

    const { data: passage } = await service
      .from('passages')
      .select('word_count')
      .eq('id', level.passage_id)
      .single();

    const wc = passage?.word_count ?? 0;

    if (user) {
      const { data: attempt, error } = await service
        .from('level_attempts')
        .insert({
          user_id: user.id,
          level_id: levelId,
          passage_id: level.passage_id,
          target_wpm: level.target_wpm,
          word_count: wc,
        })
        .select('id')
        .single();

      if (error) {
        console.error('[training/attempts/start]', error);
        return NextResponse.json({ error: 'start_failed' }, { status: 500 });
      }

      return NextResponse.json({ attempt_id: attempt.id, word_count: wc });
    }

    return NextResponse.json({
      attempt_id: null,
      word_count: wc,
      preview: true,
    });
  } catch (err) {
    console.error('[training/attempts/start]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
