import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { fetchIsPaidProfile, mapEntrySubscriptionError } from '@/lib/profile-server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { story_id: storyId, chapter_id: chapterId } = await request.json();
    if (!storyId || !chapterId) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const service = createServiceClient();

    const { data: chapter } = await service
      .from('adventure_chapters')
      .select('id, slug, target_wpm, word_count, chapter_number')
      .eq('id', chapterId)
      .eq('story_id', storyId)
      .maybeSingle();

    if (!chapter) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: 'auth_required' }, { status: 401 });
    }

    const isPaid = await fetchIsPaidProfile(service, user.id);
    const subscriptionError = mapEntrySubscriptionError(chapter.chapter_number, isPaid);
    if (subscriptionError) {
      return NextResponse.json({ error: subscriptionError }, { status: 403 });
    }

    const { data: attempt, error } = await service
      .from('adventure_chapter_attempts')
      .insert({
        user_id: user.id,
        story_id: storyId,
        chapter_id: chapterId,
        target_wpm: chapter.target_wpm,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: 'start_failed' }, { status: 500 });
    }

    return NextResponse.json({
      attempt_id: attempt.id,
      word_count: chapter.word_count,
    });
  } catch (err) {
    console.error('[adventures/attempts/start]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
