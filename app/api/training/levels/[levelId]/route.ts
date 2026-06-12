import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { ANONYMOUS_PREVIEW_LEVEL_SLUG } from '@/lib/training/constants';
import type { QuizQuestionPublic, TrainingLevelDetailResponse } from '@/lib/training/types';

export async function GET(
  _request: Request,
  { params }: { params: { levelId: string } }
) {
  try {
    const levelId = params.levelId;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const service = createServiceClient();

    const { data: level, error: levelError } = await service
      .from('training_levels')
      .select('*, training_tiers!inner(id, slug)')
      .eq('id', levelId)
      .maybeSingle();

    if (levelError || !level) {
      return NextResponse.json({ error: 'level_not_found' }, { status: 404 });
    }

    if (!user && level.slug !== ANONYMOUS_PREVIEW_LEVEL_SLUG) {
      return NextResponse.json({ error: 'auth_required' }, { status: 401 });
    }

    if (user && level.level_number > 1) {
      const { data: progress } = await service
        .from('user_level_progress')
        .select('status')
        .eq('user_id', user.id)
        .eq('level_id', levelId)
        .maybeSingle();

      if (progress?.status === 'locked') {
        return NextResponse.json({ error: 'level_locked' }, { status: 403 });
      }

      if (!progress) {
        const { data: prevLevel } = await service
          .from('training_levels')
          .select('id')
          .eq('tier_id', level.tier_id)
          .eq('level_number', level.level_number - 1)
          .maybeSingle();

        if (prevLevel) {
          const { data: prevProgress } = await service
            .from('user_level_progress')
            .select('status')
            .eq('user_id', user.id)
            .eq('level_id', prevLevel.id)
            .maybeSingle();

          const prevPassed =
            prevProgress?.status === 'completed' || prevProgress?.status === 'mastered';

          if (!prevPassed) {
            const { data: prevAttempt } = await service
              .from('level_attempts')
              .select('passed')
              .eq('user_id', user.id)
              .eq('level_id', prevLevel.id)
              .eq('passed', true)
              .limit(1)
              .maybeSingle();

            if (!prevAttempt) {
              return NextResponse.json({ error: 'level_locked' }, { status: 403 });
            }
          }
        }
      }
    }

    const { data: passage } = await service
      .from('passages')
      .select('*')
      .eq('id', level.passage_id)
      .single();

    const { data: questions } = await service
      .from('quiz_questions')
      .select('id, sort_order, prompt, options')
      .eq('quiz_id', level.quiz_id)
      .order('sort_order', { ascending: true });

    const publicQuestions: QuizQuestionPublic[] = (questions ?? []).map((q) => ({
      id: q.id,
      sort_order: q.sort_order,
      prompt: q.prompt,
      options: q.options as string[],
    }));

    const tier = level.training_tiers as { id: string; slug: string };

    const response: TrainingLevelDetailResponse = {
      level: {
        id: level.id,
        tier_id: level.tier_id,
        slug: level.slug,
        title: level.title,
        level_number: level.level_number,
        target_wpm: level.target_wpm,
        passage_id: level.passage_id,
        quiz_id: level.quiz_id,
        xp_base: level.xp_base,
        xp_pass: level.xp_pass,
        xp_mastery: level.xp_mastery,
        min_correct_to_pass: level.min_correct_to_pass,
        is_paid_only: level.is_paid_only,
        sort_order: level.sort_order,
      },
      passage: passage!,
      questions: publicQuestions,
      tier_id: tier.id,
      tier_slug: tier.slug,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[training/levels]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
