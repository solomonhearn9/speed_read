import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { resolveChapterStatus } from '@/lib/adventures/progress';
import { fetchIsPaidProfile, mapEntrySubscriptionError } from '@/lib/profile-server';
import type { AdventureChapterDetailResponse, AdventureQuestionPublic } from '@/lib/adventures/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { storySlug: string; chapterSlug: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const service = createServiceClient();

    const { data: story } = await service
      .from('adventure_stories')
      .select('*')
      .eq('slug', params.storySlug)
      .maybeSingle();

    if (!story) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const { data: chapter } = await service
      .from('adventure_chapters')
      .select('*')
      .eq('story_id', story.id)
      .eq('slug', params.chapterSlug)
      .maybeSingle();

    if (!chapter) {
      return NextResponse.json({ error: 'chapter_not_found' }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: 'auth_required' }, { status: 401 });
    }

    const isPaid = await fetchIsPaidProfile(service, user.id);
    const subscriptionError = mapEntrySubscriptionError(chapter.chapter_number, isPaid);
    if (subscriptionError) {
      return NextResponse.json({ error: subscriptionError }, { status: 403 });
    }

    const completedChapters = new Set<number>();
    const passedChapters = new Set<number>();

    if (chapter.chapter_number > 1) {
      const { data: userProgress } = await service
        .from('user_adventure_progress')
        .select('chapters_completed')
        .eq('user_id', user.id)
        .eq('story_id', story.id)
        .maybeSingle();

      if (userProgress) {
        for (let i = 1; i <= userProgress.chapters_completed; i++) {
          completedChapters.add(i);
        }
      }

      const { data: allChapters } = await service
        .from('adventure_chapters')
        .select('id, chapter_number')
        .eq('story_id', story.id);

      const { data: passedAttempts } = await service
        .from('adventure_chapter_attempts')
        .select('chapter_id')
        .eq('user_id', user.id)
        .eq('story_id', story.id)
        .eq('passed', true);

      passedAttempts?.forEach((a) => {
        const ch = allChapters?.find((c) => c.id === a.chapter_id);
        if (ch) passedChapters.add(ch.chapter_number);
      });
    }

    const status = resolveChapterStatus(
      chapter.chapter_number,
      completedChapters,
      passedChapters,
      true,
      isPaid
    );

    if (status === 'locked') {
      return NextResponse.json({ error: 'chapter_locked' }, { status: 403 });
    }

    const { data: questions } = await service
      .from('adventure_questions')
      .select('id, sort_order, prompt, options')
      .eq('chapter_id', chapter.id)
      .order('sort_order', { ascending: true });

    const publicQuestions: AdventureQuestionPublic[] = (questions ?? []).map((q) => ({
      id: q.id,
      sort_order: q.sort_order,
      prompt: q.prompt,
      options: q.options as string[],
    }));

    const response: AdventureChapterDetailResponse = {
      story,
      chapter,
      questions: publicQuestions,
      status,
      chapter_number: chapter.chapter_number,
      total_chapters: story.total_chapters,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[adventures/chapter]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
