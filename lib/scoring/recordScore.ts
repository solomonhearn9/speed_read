import type { SupabaseClient } from '@supabase/supabase-js';
import type { PuzzleTrack } from '@/lib/puzzles/types';
import {
  BASE_XP_DEFAULT,
  DAILY_STREAK_BONUS_XP,
  computeLevelScore,
  nextStreakState,
  roundScore,
} from './formula';

export interface RecordScoreInput {
  userId: string;
  levelId: string;
  track: PuzzleTrack;
  questionsCorrect: number;
  questionsTotal: number;
  wpm: number;
  baseXp?: number;
}

export interface RecordScoreResult {
  recorded: boolean;
  computed_score: number;
  streak_bonus_applied: number;
  total_score: number;
  current_streak: number;
  best_streak: number;
}

/**
 * Persist a verified (2/3+) completion into score_events + user_scores.
 * Unverified runs return recorded:false and write nothing.
 */
export async function recordVerifiedScoreEvent(
  service: SupabaseClient,
  input: RecordScoreInput
): Promise<RecordScoreResult> {
  const empty: RecordScoreResult = {
    recorded: false,
    computed_score: 0,
    streak_bonus_applied: 0,
    total_score: 0,
    current_streak: 0,
    best_streak: 0,
  };

  // Only 0–3 comprehension results are modeled; gate on verified pass (≥2).
  const correct = Math.min(3, Math.max(0, input.questionsCorrect));
  const levelScore = computeLevelScore({
    baseXp: input.baseXp ?? BASE_XP_DEFAULT,
    questionsCorrect: correct,
    wpm: input.wpm,
  });

  if (levelScore <= 0) return empty;

  const { data: existing } = await service
    .from('user_scores')
    .select('*')
    .eq('user_id', input.userId)
    .eq('track', input.track)
    .maybeSingle();

  const today = new Date().toISOString().split('T')[0];
  const streak = nextStreakState(
    existing?.last_active_date ?? null,
    today,
    existing?.current_streak ?? 0,
    existing?.best_streak ?? 0
  );

  const streakBonus = streak.isNewStreakDay ? DAILY_STREAK_BONUS_XP : 0;
  const eventScore = roundScore(levelScore + streakBonus);
  const newTotal = roundScore(Number(existing?.total_score ?? 0) + eventScore);

  await service.from('score_events').insert({
    user_id: input.userId,
    level_id: input.levelId,
    track: input.track,
    timestamp: new Date().toISOString(),
    comprehension_result: correct,
    wpm: Math.round(input.wpm),
    computed_score: eventScore,
    streak_bonus_applied: streakBonus,
  });

  await service.from('user_scores').upsert(
    {
      user_id: input.userId,
      track: input.track,
      total_score: newTotal,
      total_verified_completions: (existing?.total_verified_completions ?? 0) + 1,
      current_streak: streak.current_streak,
      best_streak: streak.best_streak,
      last_active_date: today,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,track' }
  );

  return {
    recorded: true,
    computed_score: eventScore,
    streak_bonus_applied: streakBonus,
    total_score: newTotal,
    current_streak: streak.current_streak,
    best_streak: streak.best_streak,
  };
}

/** Cheap top-N query against the rollup — for future leagues / tests. */
export async function getTopUsersByScore(
  service: SupabaseClient,
  track: PuzzleTrack,
  limit = 10
): Promise<Array<{ user_id: string; display_name: string | null; total_score: number }>> {
  const { data: scores, error } = await service
    .from('user_scores')
    .select('user_id, total_score')
    .eq('track', track)
    .order('total_score', { ascending: false })
    .limit(limit);

  if (error || !scores?.length) return [];

  const ids = scores.map((s) => s.user_id as string);
  const { data: profiles } = await service
    .from('profiles')
    .select('id, display_name')
    .in('id', ids);

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id as string, (p.display_name as string | null) ?? null])
  );

  return scores.map((row) => ({
    user_id: row.user_id as string,
    display_name: nameById.get(row.user_id as string) ?? null,
    total_score: Number(row.total_score),
  }));
}
