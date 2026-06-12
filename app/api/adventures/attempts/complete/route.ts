import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ANONYMOUS_PREVIEW_CHAPTER_SLUG } from '@/lib/adventures/constants';
import { gradeAnswers, updateProfileXp } from '@/lib/adventures/progress';
import type { AdventureCompleteResult } from '@/lib/adventures/types';

export const dynamic = 'force-dynamic';

interface CompleteBody {
  attempt_id?: string | null;
  story_id: string;
  chapter_id: string;
  answers: Array<{ question_id: string; selected_index: number }>;
  elapsed_seconds: number;
  words_read: number;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompleteBody;
    const { story_id: storyId, chapter_id: chapterId, answers, elapsed_seconds, words_read } = body;

    if (!storyId || !chapterId || !answers?.length) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const service = createServiceClient();

    const { data: story } = await service
      .from('adventure_stories')
      .select('*')
      .eq('id', storyId)
      .single();

    const { data: chapter } = await service
      .from('adventure_chapters')
      .select('*')
      .eq('id', chapterId)
      .eq('story_id', storyId)
      .single();

    if (!story || !chapter) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (!user && chapter.slug !== ANONYMOUS_PREVIEW_CHAPTER_SLUG) {
      return NextResponse.json({ error: 'auth_required' }, { status: 401 });
    }

    const { data: questions } = await service
      .from('adventure_questions')
      .select('id, correct_index')
      .eq('chapter_id', chapterId)
      .order('sort_order', { ascending: true });

    if (!questions?.length) {
      return NextResponse.json({ error: 'quiz_not_found' }, { status: 404 });
    }

    const grade = gradeAnswers(questions, answers);

    if (!user) {
      const preview: AdventureCompleteResult = {
        attempt_id: '',
        saved: false,
        requires_auth: true,
        story_id: storyId,
        story_slug: story.slug,
        chapter_id: chapterId,
        chapter_slug: chapter.slug,
        chapter_number: chapter.chapter_number,
        chapter_title: chapter.title,
        questions_correct: grade.correct,
        questions_total: grade.total,
        comprehension_pct: grade.pct,
        passed: grade.passed,
        xp_awarded: 0,
        reward_name: chapter.reward_name,
        story_completed: false,
        next_chapter_slug: null,
        next_chapter_unlocked: false,
        total_xp: 0,
        reader_level: 1,
      };
      return NextResponse.json(preview);
    }

    let xpAwarded = grade.passed ? chapter.xp_reward : Math.max(5, Math.floor(chapter.xp_reward / 5));
    const storyCompleted = grade.passed && chapter.chapter_number === story.total_chapters;
    if (storyCompleted) {
      xpAwarded += chapter.completion_bonus_xp;
    }

    const completedAt = new Date().toISOString();

    if (body.attempt_id) {
      await service
        .from('adventure_chapter_attempts')
        .update({
          completed_at: completedAt,
          words_read,
          elapsed_seconds,
          questions_correct: grade.correct,
          questions_total: grade.total,
          comprehension_pct: grade.pct,
          xp_awarded: xpAwarded,
          passed: grade.passed,
        })
        .eq('id', body.attempt_id)
        .eq('user_id', user.id);
    } else {
      await service.from('adventure_chapter_attempts').insert({
        user_id: user.id,
        story_id: storyId,
        chapter_id: chapterId,
        started_at: new Date(Date.now() - elapsed_seconds * 1000).toISOString(),
        completed_at: completedAt,
        target_wpm: chapter.target_wpm,
        words_read,
        elapsed_seconds,
        questions_correct: grade.correct,
        questions_total: grade.total,
        comprehension_pct: grade.pct,
        xp_awarded: xpAwarded,
        passed: grade.passed,
      });
    }

    const { data: existingProgress } = await service
      .from('user_adventure_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('story_id', storyId)
      .maybeSingle();

    const newChaptersCompleted = grade.passed
      ? Math.max(existingProgress?.chapters_completed ?? 0, chapter.chapter_number)
      : existingProgress?.chapters_completed ?? 0;

    const nextChapterNumber = grade.passed ? chapter.chapter_number + 1 : chapter.chapter_number;

    await service.from('user_adventure_progress').upsert(
      {
        user_id: user.id,
        story_id: storyId,
        current_chapter_number: Math.min(nextChapterNumber, story.total_chapters),
        chapters_completed: newChaptersCompleted,
        completed_at: storyCompleted ? completedAt : existingProgress?.completed_at ?? null,
        total_xp_earned: (existingProgress?.total_xp_earned ?? 0) + xpAwarded,
        updated_at: completedAt,
      },
      { onConflict: 'user_id,story_id' }
    );

    const profileUpdate = await updateProfileXp(service, user.id, xpAwarded);

    let nextChapterSlug: string | null = null;
    if (grade.passed && chapter.chapter_number < story.total_chapters) {
      const { data: nextChapter } = await service
        .from('adventure_chapters')
        .select('slug')
        .eq('story_id', storyId)
        .eq('chapter_number', chapter.chapter_number + 1)
        .maybeSingle();
      nextChapterSlug = nextChapter?.slug ?? null;
    }

    const result: AdventureCompleteResult = {
      attempt_id: body.attempt_id ?? '',
      saved: true,
      requires_auth: false,
      story_id: storyId,
      story_slug: story.slug,
      chapter_id: chapterId,
      chapter_slug: chapter.slug,
      chapter_number: chapter.chapter_number,
      chapter_title: chapter.title,
      questions_correct: grade.correct,
      questions_total: grade.total,
      comprehension_pct: grade.pct,
      passed: grade.passed,
      xp_awarded: xpAwarded,
      reward_name: chapter.reward_name,
      story_completed: storyCompleted,
      next_chapter_slug: nextChapterSlug,
      next_chapter_unlocked: !!nextChapterSlug,
      total_xp: profileUpdate.total_xp,
      reader_level: profileUpdate.reader_level,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[adventures/attempts/complete]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
