/**
 * Confirms the rollup ordering contract used by getTopUsersByScore.
 * Run: npx tsx lib/scoring/rollup.selftest.ts
 */
import { computeLevelScore, nextStreakState, DAILY_STREAK_BONUS_XP } from './formula';

type Rollup = {
  user_id: string;
  total_score: number;
  total_verified_completions: number;
  current_streak: number;
  best_streak: number;
  last_active_date: string | null;
};

function applyEvent(
  rollup: Rollup,
  today: string,
  questionsCorrect: number,
  wpm: number
): Rollup {
  const levelScore = computeLevelScore({ questionsCorrect, wpm });
  if (levelScore <= 0) return rollup;

  const streak = nextStreakState(
    rollup.last_active_date,
    today,
    rollup.current_streak,
    rollup.best_streak
  );
  const bonus = streak.isNewStreakDay ? DAILY_STREAK_BONUS_XP : 0;

  return {
    ...rollup,
    total_score: Math.round((rollup.total_score + levelScore + bonus) * 100) / 100,
    total_verified_completions: rollup.total_verified_completions + 1,
    current_streak: streak.current_streak,
    best_streak: streak.best_streak,
    last_active_date: today,
  };
}

function empty(id: string): Rollup {
  return {
    user_id: id,
    total_score: 0,
    total_verified_completions: 0,
    current_streak: 0,
    best_streak: 0,
    last_active_date: null,
  };
}

let grinder = empty('grinder'); // five honest 300 WPM days
let sprinter = empty('sprinter'); // one elite 900 WPM run

grinder = applyEvent(grinder, '2026-07-18', 2, 300);
grinder = applyEvent(grinder, '2026-07-19', 2, 300);
grinder = applyEvent(grinder, '2026-07-20', 2, 300);
grinder = applyEvent(grinder, '2026-07-21', 2, 300);
grinder = applyEvent(grinder, '2026-07-22', 2, 300);

sprinter = applyEvent(sprinter, '2026-07-22', 3, 900);

const ranked = [grinder, sprinter].sort((a, b) => b.total_score - a.total_score);

if (ranked[0].user_id !== 'grinder') {
  throw new Error(
    `Expected grinder on top, got ${ranked[0].user_id} (${ranked[0].total_score} vs ${ranked[1].total_score})`
  );
}

// Unverified must not move the rollup
const before = { ...grinder };
grinder = applyEvent(grinder, '2026-07-22', 1, 900);
if (grinder.total_score !== before.total_score) {
  throw new Error('Unverified run must not change total_score');
}

console.log('scoring rollup selftest OK', {
  top: ranked.map((r) => ({ id: r.user_id, score: r.total_score, streak: r.current_streak })),
});
