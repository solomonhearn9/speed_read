import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getContinueGate } from '@/lib/accessTier';
import { checkMapEntryAccess, fetchIsPaidProfile } from '@/lib/profile-server';
import { getNextLevel, unlockNextLevel, updateProfileXpAndStreak } from '@/lib/training/progress';
import {
  calculateActualWpm,
  calculateComprehensionPct,
  calculateXpAward,
} from '@/lib/training/xp';
import type { AttemptCompleteResult } from '@/lib/training/types';

interface CompleteBody {
  level_id: string;
  attempt_id?: string | null;
  elapsed_seconds: number;
  words_read: number;
  answers: Array<{ question_id: string; selected_index: number }>;
  target_wpm?: number;
  actual_wpm?: number;
  continue_anyway?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompleteBody;
    const {
      level_id: levelId,
      attempt_id: attemptId,
      elapsed_seconds: elapsedSeconds,
      words_read: wordsRead,
      answers,
    } = body;

    if (!levelId || !answers?.length) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const service = createServiceClient();

    const { data: level } = await service
      .from('training_levels')
      .select('*')
      .eq('id', levelId)
      .maybeSingle();

    if (!level) {
      return NextResponse.json({ error: 'level_not_found' }, { status: 404 });
    }

    const isPaid = user ? await fetchIsPaidProfile(service, user.id) : false;
    const accessError = checkMapEntryAccess(level.level_number, !!user, isPaid, level.access_tier);
    if (accessError === 'signup_required') {
      return NextResponse.json({ error: 'auth_required' }, { status: 401 });
    }
    if (accessError === 'subscription_required') {
      return NextResponse.json({ error: 'subscription_required' }, { status: 403 });
    }

    const { data: questions } = await service
      .from('quiz_questions')
      .select('id, correct_index')
      .eq('quiz_id', level.quiz_id)
      .order('sort_order', { ascending: true });

    if (!questions?.length) {
      return NextResponse.json({ error: 'quiz_not_found' }, { status: 404 });
    }

    const answerMap = new Map(answers.map((a) => [a.question_id, a.selected_index]));
    let questionsCorrect = 0;
    questions.forEach((q) => {
      if (answerMap.get(q.id) === q.correct_index) {
        questionsCorrect += 1;
      }
    });

    const questionsTotal = questions.length;
    const comprehensionPct = calculateComprehensionPct(questionsCorrect, questionsTotal);
    const targetWpm = level.target_wpm;
    const actualWpm = body.actual_wpm ?? calculateActualWpm(wordsRead, elapsedSeconds);
    const passed = questionsCorrect >= level.min_correct_to_pass;
    const mastered = questionsCorrect === questionsTotal;

    // Anonymous free-tier completion: grade only, no save — cliffhanger signup for next
    if (!user) {
      const nextLevel = await getNextLevel(service, level.tier_id, level.level_number);
      const continueGate = getContinueGate(
        nextLevel?.level_number ?? null,
        false,
        false,
        nextLevel?.access_tier
      );
      const result: AttemptCompleteResult = {
        attempt_id: '',
        saved: false,
        requires_auth: continueGate === 'signup',
        continue_gate: continueGate,
        level_id: levelId,
        level_title: level.title,
        level_number: level.level_number,
        target_wpm: targetWpm,
        actual_wpm: actualWpm,
        questions_correct: questionsCorrect,
        questions_total: questionsTotal,
        comprehension_pct: comprehensionPct,
        passed,
        mastered,
        xp_awarded: 0,
        is_personal_best: false,
        next_level_id: nextLevel?.id ?? null,
        next_level_wpm: nextLevel?.target_wpm ?? null,
        next_level_title: nextLevel?.title ?? null,
        next_level_unlocked: false,
        reader_level: 1,
        total_xp: 0,
        reader_level_up: false,
        current_streak: 0,
      };
      return NextResponse.json(result);
    }

    if (body.continue_anyway && attemptId) {
      const { data: existingAttempt } = await service
        .from('level_attempts')
        .select('id, completed_at')
        .eq('id', attemptId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingAttempt?.completed_at) {
        const nextLevel = await getNextLevel(service, level.tier_id, level.level_number);

        if (nextLevel) {
          await service.from('user_level_progress').upsert(
            {
              user_id: user.id,
              level_id: nextLevel.id,
              status: 'unlocked',
              unlocked_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,level_id' }
          );
        }

        const { data: profile } = await service
          .from('profiles')
          .select('total_xp, reader_level, current_streak')
          .eq('id', user.id)
          .single();

        const continueGate = getContinueGate(
          nextLevel?.level_number ?? null,
          true,
          isPaid,
          nextLevel?.access_tier
        );
        return NextResponse.json({
          attempt_id: attemptId,
          saved: true,
          requires_auth: continueGate === 'signup',
          continue_gate: continueGate,
          level_id: levelId,
          level_title: level.title,
          level_number: level.level_number,
          target_wpm: level.target_wpm,
          actual_wpm: body.actual_wpm ?? calculateActualWpm(wordsRead, elapsedSeconds),
          questions_correct: questionsCorrect,
          questions_total: questionsTotal,
          comprehension_pct: comprehensionPct,
          passed: false,
          mastered: false,
          xp_awarded: 0,
          is_personal_best: false,
          next_level_id: nextLevel?.id ?? null,
          next_level_wpm: nextLevel?.target_wpm ?? null,
          next_level_title: nextLevel?.title ?? null,
          next_level_unlocked: !!nextLevel && continueGate === 'none',
          reader_level: profile?.reader_level ?? 1,
          total_xp: profile?.total_xp ?? 0,
          reader_level_up: false,
          current_streak: profile?.current_streak ?? 0,
        } satisfies AttemptCompleteResult);
      }
    }

    const { data: existingProgress } = await service
      .from('user_level_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('level_id', levelId)
      .maybeSingle();

    const isFirstCompletion = !existingProgress?.first_completed_at;

    const xpResult = calculateXpAward({
      xpBase: level.xp_base,
      xpPass: level.xp_pass,
      xpMastery: level.xp_mastery,
      questionsCorrect,
      questionsTotal,
      minCorrectToPass: level.min_correct_to_pass,
      isFirstCompletion,
    });

    const completedAt = new Date().toISOString();
    let savedAttemptId = attemptId ?? null;

    if (attemptId) {
      await service
        .from('level_attempts')
        .update({
          completed_at: completedAt,
          actual_wpm: actualWpm,
          words_read: wordsRead,
          elapsed_seconds: elapsedSeconds,
          quiz_score: comprehensionPct,
          questions_correct: questionsCorrect,
          questions_total: questionsTotal,
          comprehension_pct: comprehensionPct,
          xp_awarded: xpResult.xp,
          passed: xpResult.passed,
          mastered: xpResult.mastered,
        })
        .eq('id', attemptId)
        .eq('user_id', user.id);
    } else {
      const { data: passage } = await service
        .from('passages')
        .select('word_count')
        .eq('id', level.passage_id)
        .single();

      const { data: newAttempt } = await service
        .from('level_attempts')
        .insert({
          user_id: user.id,
          level_id: levelId,
          passage_id: level.passage_id,
          started_at: new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
          completed_at: completedAt,
          target_wpm: targetWpm,
          actual_wpm: actualWpm,
          word_count: passage?.word_count ?? wordsRead,
          words_read: wordsRead,
          elapsed_seconds: elapsedSeconds,
          quiz_score: comprehensionPct,
          questions_correct: questionsCorrect,
          questions_total: questionsTotal,
          comprehension_pct: comprehensionPct,
          xp_awarded: xpResult.xp,
          passed: xpResult.passed,
          mastered: xpResult.mastered,
        })
        .select('id')
        .single();

      savedAttemptId = newAttempt?.id ?? null;
    }

    const newStatus = xpResult.mastered
      ? 'mastered'
      : xpResult.passed
        ? 'completed'
        : 'completed';

    const isPersonalBest =
      !existingProgress?.best_comprehension_pct ||
      comprehensionPct > existingProgress.best_comprehension_pct ||
      (comprehensionPct === existingProgress.best_comprehension_pct &&
        actualWpm > (existingProgress.best_wpm ?? 0));

    await service.from('user_level_progress').upsert(
      {
        user_id: user.id,
        level_id: levelId,
        status: existingProgress?.status === 'mastered' ? 'mastered' : newStatus,
        unlocked_at: existingProgress?.unlocked_at ?? completedAt,
        first_completed_at: existingProgress?.first_completed_at ?? completedAt,
        best_wpm: isPersonalBest
          ? actualWpm
          : existingProgress?.best_wpm ?? actualWpm,
        best_comprehension_pct: Math.max(
          existingProgress?.best_comprehension_pct ?? 0,
          comprehensionPct
        ),
        best_quiz_score: Math.max(
          existingProgress?.best_quiz_score ?? 0,
          questionsCorrect
        ),
        attempts_count: (existingProgress?.attempts_count ?? 0) + 1,
      },
      { onConflict: 'user_id,level_id' }
    );

    const profileUpdate = await updateProfileXpAndStreak(
      service,
      user.id,
      xpResult.xp,
      xpResult.passed
    );

    let nextLevel: Awaited<ReturnType<typeof getNextLevel>> = null;

    if (xpResult.passed) {
      nextLevel = await unlockNextLevel(
        service,
        user.id,
        level.level_number,
        level.tier_id
      );
    } else if (body.continue_anyway) {
      nextLevel = await getNextLevel(service, level.tier_id, level.level_number);

      if (nextLevel) {
        await service.from('user_level_progress').upsert(
          {
            user_id: user.id,
            level_id: nextLevel.id,
            status: 'unlocked',
            unlocked_at: completedAt,
          },
          { onConflict: 'user_id,level_id' }
        );
      }
    }

    const continueGate = getContinueGate(
      nextLevel?.level_number ?? (xpResult.passed || body.continue_anyway
        ? level.level_number + 1
        : null),
      true,
      isPaid,
      nextLevel?.access_tier
    );

    // Don't unlock subscription-gated next for unpaid users
    if (continueGate === 'subscription' && nextLevel) {
      nextLevel = await getNextLevel(service, level.tier_id, level.level_number);
    }

    const result: AttemptCompleteResult = {
      attempt_id: savedAttemptId ?? '',
      saved: true,
      requires_auth: continueGate === 'signup',
      continue_gate: continueGate,
      level_id: levelId,
      level_title: level.title,
      level_number: level.level_number,
      target_wpm: targetWpm,
      actual_wpm: actualWpm,
      questions_correct: questionsCorrect,
      questions_total: questionsTotal,
      comprehension_pct: comprehensionPct,
      passed: xpResult.passed,
      mastered: xpResult.mastered,
      xp_awarded: xpResult.xp,
      is_personal_best: isPersonalBest,
      next_level_id: continueGate === 'none' ? nextLevel?.id ?? null : nextLevel?.id ?? null,
      next_level_wpm: nextLevel?.target_wpm ?? null,
      next_level_title: nextLevel?.title ?? null,
      next_level_unlocked: !!nextLevel && continueGate === 'none',
      reader_level: profileUpdate.reader_level,
      total_xp: profileUpdate.total_xp,
      reader_level_up: profileUpdate.readerLevelUp,
      current_streak: profileUpdate.current_streak,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[training/attempts/complete]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
