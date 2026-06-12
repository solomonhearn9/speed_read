import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { ensureFirstLevelUnlocked, resolveProgressStatus } from '@/lib/training/progress';
import type { LevelWithProgress, TrainingPathResponse } from '@/lib/training/types';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const service = createServiceClient();

    const { data: tiers, error: tiersError } = await service
      .from('training_tiers')
      .select('*')
      .order('sort_order', { ascending: true });

    if (tiersError || !tiers?.length) {
      return NextResponse.json({ error: 'training_not_found' }, { status: 404 });
    }

    const { data: levels, error: levelsError } = await service
      .from('training_levels')
      .select('*')
      .order('sort_order', { ascending: true });

    if (levelsError || !levels?.length) {
      return NextResponse.json({ error: 'levels_not_found' }, { status: 404 });
    }

    let progressMap = new Map<string, {
      status: string;
      best_wpm: number | null;
      best_comprehension_pct: number | null;
      best_quiz_score: number | null;
      attempts_count: number;
    }>();

    let profileProgress = {
      total_xp: 0,
      reader_level: 1,
      current_streak: 0,
      longest_streak: 0,
    };

    const passedLevelNumbers = new Set<number>();
    let lowScoreContinueLevel: number | null = null;

    if (user) {
      const firstLevel = levels.find((l) => l.level_number === 1);
      if (firstLevel) {
        await ensureFirstLevelUnlocked(service, user.id, firstLevel.id);
      }

      const { data: progressRows } = await service
        .from('user_level_progress')
        .select('*')
        .eq('user_id', user.id);

      progressRows?.forEach((row) => {
        progressMap.set(row.level_id, {
          status: row.status,
          best_wpm: row.best_wpm,
          best_comprehension_pct: row.best_comprehension_pct,
          best_quiz_score: row.best_quiz_score,
          attempts_count: row.attempts_count ?? 0,
        });
        const level = levels.find((l) => l.id === row.level_id);
        if (level && (row.status === 'completed' || row.status === 'mastered')) {
          passedLevelNumbers.add(level.level_number);
        }
      });

      for (const lvl of levels) {
        if (lvl.level_number > 1 && passedLevelNumbers.has(lvl.level_number - 1)) {
          const stored = progressMap.get(lvl.id);
          if (!stored || stored.status === 'locked') {
            await service.from('user_level_progress').upsert(
              {
                user_id: user.id,
                level_id: lvl.id,
                status: 'unlocked',
                unlocked_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,level_id' }
            );
            progressMap.set(lvl.id, {
              status: 'unlocked',
              best_wpm: stored?.best_wpm ?? null,
              best_comprehension_pct: stored?.best_comprehension_pct ?? null,
              best_quiz_score: stored?.best_quiz_score ?? null,
              attempts_count: stored?.attempts_count ?? 0,
            });
          }
        }
      }

      const { data: profile } = await service
        .from('profiles')
        .select('total_xp, reader_level, current_streak, longest_streak')
        .eq('id', user.id)
        .single();

      if (profile) {
        profileProgress = {
          total_xp: profile.total_xp ?? 0,
          reader_level: profile.reader_level ?? 1,
          current_streak: profile.current_streak ?? 0,
          longest_streak: profile.longest_streak ?? 0,
        };
      }

      const { data: recentAttempts } = await service
        .from('level_attempts')
        .select('level_id, passed')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: passedAttempts } = await service
        .from('level_attempts')
        .select('level_id')
        .eq('user_id', user.id)
        .eq('passed', true);

      passedAttempts?.forEach((a) => {
        const lvl = levels.find((l) => l.id === a.level_id);
        if (lvl) passedLevelNumbers.add(lvl.level_number);
      });

      for (const attempt of recentAttempts ?? []) {
        const attemptLevel = levels.find((l) => l.id === attempt.level_id);
        if (attemptLevel && !attempt.passed) {
          lowScoreContinueLevel = attemptLevel.level_number + 1;
          break;
        }
      }
    }

    const tiersWithLevels = tiers.map((tier) => {
      const tierLevels = levels
        .filter((l) => l.tier_id === tier.id)
        .map((level): LevelWithProgress => {
          const stored = progressMap.get(level.id);
          const status = resolveProgressStatus(
            stored?.status as LevelWithProgress['status'] | undefined ?? null,
            level.level_number,
            passedLevelNumbers,
            !!user
          );

          const recommendRetry =
            !!user &&
            lowScoreContinueLevel === level.level_number &&
            status === 'unlocked';

          return {
            ...level,
            status,
            best_wpm: stored?.best_wpm ?? null,
            best_comprehension_pct: stored?.best_comprehension_pct ?? null,
            best_quiz_score: stored?.best_quiz_score ?? null,
            attempts_count: stored?.attempts_count ?? 0,
            recommend_retry: recommendRetry,
          };
        });

      return { ...tier, levels: tierLevels };
    });

    const response: TrainingPathResponse = {
      tiers: tiersWithLevels,
      profile: {
        ...profileProgress,
        is_logged_in: !!user,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[training/path]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
