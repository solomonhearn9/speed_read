import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveAccessTier } from '@/lib/accessTier';
import type { ChapterStatus } from './types';
import { MIN_CORRECT_TO_PASS } from './constants';
import { calculateComprehensionPct, calculateReaderLevel } from '@/lib/training/xp';

export function resolveChapterStatus(
  chapterNumber: number,
  completedChapters: Set<number>,
  passedChapters: Set<number>,
  isLoggedIn: boolean,
  isPaid: boolean,
  explicitAccessTier?: string | null
): ChapterStatus {
  const accessTier = resolveAccessTier(chapterNumber, explicitAccessTier);

  if (accessTier === 'subscription' && !isPaid) return 'locked';
  if (accessTier === 'signup' && !isLoggedIn) return 'locked';

  if (completedChapters.has(chapterNumber)) return 'completed';

  if (!isLoggedIn) {
    return accessTier === 'free' ? 'unlocked' : 'locked';
  }

  if (chapterNumber === 1 || accessTier === 'free') return 'unlocked';
  if (passedChapters.has(chapterNumber - 1)) return 'unlocked';
  return 'locked';
}

export async function updateProfileXp(
  service: SupabaseClient,
  userId: string,
  xpAwarded: number
): Promise<{ total_xp: number; reader_level: number; readerLevelUp: boolean }> {
  const { data: profile } = await service
    .from('profiles')
    .select('total_xp, reader_level')
    .eq('id', userId)
    .single();

  const previousXp = profile?.total_xp ?? 0;
  const previousLevel = profile?.reader_level ?? 1;
  const newTotalXp = previousXp + xpAwarded;
  const newReaderLevel = calculateReaderLevel(newTotalXp);

  await service
    .from('profiles')
    .update({
      total_xp: newTotalXp,
      reader_level: newReaderLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  return {
    total_xp: newTotalXp,
    reader_level: newReaderLevel,
    readerLevelUp: newReaderLevel > previousLevel,
  };
}

export function gradeAnswers(
  questions: Array<{ id: string; correct_index: number }>,
  answers: Array<{ question_id: string; selected_index: number }>
): { correct: number; total: number; passed: boolean; pct: number } {
  const answerMap = new Map(answers.map((a) => [a.question_id, a.selected_index]));
  let correct = 0;
  questions.forEach((q) => {
    if (answerMap.get(q.id) === q.correct_index) correct += 1;
  });
  const total = questions.length;
  const passed = correct >= MIN_CORRECT_TO_PASS;
  return { correct, total, passed, pct: calculateComprehensionPct(correct, total) };
}
