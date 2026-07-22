import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveAccessTier } from '@/lib/accessTier';
import { calculateReaderLevel } from './xp';

export type LevelProgressStatus = 'locked' | 'unlocked' | 'completed' | 'mastered';

export interface TrainingProfileProgress {
  total_xp: number;
  reader_level: number;
  current_streak: number;
  longest_streak: number;
  last_training_date: string | null;
}

export async function ensureFirstLevelUnlocked(
  service: SupabaseClient,
  userId: string,
  firstLevelId: string
): Promise<void> {
  const { data: existing } = await service
    .from('user_level_progress')
    .select('level_id')
    .eq('user_id', userId)
    .eq('level_id', firstLevelId)
    .maybeSingle();

  if (!existing) {
    await service.from('user_level_progress').insert({
      user_id: userId,
      level_id: firstLevelId,
      status: 'unlocked',
      unlocked_at: new Date().toISOString(),
    });
  }
}

export async function getNextLevel(
  service: SupabaseClient,
  tierId: string,
  currentLevelNumber: number
): Promise<{ id: string; target_wpm: number; title: string; level_number: number; access_tier: string | null } | null> {
  const { data: nextLevel } = await service
    .from('training_levels')
    .select('id, target_wpm, title, level_number, access_tier')
    .eq('tier_id', tierId)
    .eq('level_number', currentLevelNumber + 1)
    .maybeSingle();

  return nextLevel ?? null;
}

export async function unlockNextLevel(
  service: SupabaseClient,
  userId: string,
  currentLevelNumber: number,
  tierId: string
): Promise<{ id: string; target_wpm: number; title: string; level_number: number; access_tier: string | null } | null> {
  const nextLevel = await getNextLevel(service, tierId, currentLevelNumber);
  if (!nextLevel) return null;

  const { data: existing } = await service
    .from('user_level_progress')
    .select('status')
    .eq('user_id', userId)
    .eq('level_id', nextLevel.id)
    .maybeSingle();

  if (existing && existing.status !== 'locked') return nextLevel;

  await service.from('user_level_progress').upsert(
    {
      user_id: userId,
      level_id: nextLevel.id,
      status: 'unlocked',
      unlocked_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,level_id' }
  );

  return nextLevel;
}

export function resolveProgressStatus(
  stored: LevelProgressStatus | null,
  levelNumber: number,
  passedLevels: Set<number>,
  isLoggedIn: boolean,
  isPaid: boolean,
  explicitAccessTier?: string | null
): LevelProgressStatus {
  const accessTier = resolveAccessTier(levelNumber, explicitAccessTier);

  if (accessTier === 'subscription' && !isPaid) return 'locked';
  if (accessTier === 'signup' && !isLoggedIn) return 'locked';

  // Free tier (ch/level 1): playable anonymously
  if (!isLoggedIn) {
    return accessTier === 'free' ? 'unlocked' : 'locked';
  }

  if (stored) return stored;
  if (levelNumber === 1 || accessTier === 'free') return 'unlocked';
  if (passedLevels.has(levelNumber - 1)) return 'unlocked';
  return 'locked';
}

export async function updateProfileXpAndStreak(
  service: SupabaseClient,
  userId: string,
  xpAwarded: number,
  passed: boolean
): Promise<{
  total_xp: number;
  reader_level: number;
  current_streak: number;
  longest_streak: number;
  readerLevelUp: boolean;
  previousReaderLevel: number;
}> {
  const { data: profile } = await service
    .from('profiles')
    .select('total_xp, reader_level, current_streak, longest_streak, last_training_date')
    .eq('id', userId)
    .single();

  const previousXp = profile?.total_xp ?? 0;
  const previousReaderLevel = profile?.reader_level ?? 1;
  const newTotalXp = previousXp + xpAwarded;
  const newReaderLevel = calculateReaderLevel(newTotalXp);

  const today = new Date().toISOString().split('T')[0];
  let currentStreak = profile?.current_streak ?? 0;
  let longestStreak = profile?.longest_streak ?? 0;
  const lastDate = profile?.last_training_date;

  if (passed) {
    if (lastDate === today) {
      // same day, streak unchanged
    } else if (lastDate) {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (lastDate === yesterdayStr) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  await service
    .from('profiles')
    .update({
      total_xp: newTotalXp,
      reader_level: newReaderLevel,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_training_date: passed ? today : lastDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  return {
    total_xp: newTotalXp,
    reader_level: newReaderLevel,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    readerLevelUp: newReaderLevel > previousReaderLevel,
    previousReaderLevel,
  };
}
