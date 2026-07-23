/**
 * Lightweight self-check for persistence-dominant scoring ratios.
 * Run: npx tsx lib/scoring/formula.selftest.ts
 */
import {
  BASE_XP_DEFAULT,
  computeLevelScore,
  comprehensionMultiplier,
  nextStreakState,
  wpmMultiplier,
} from './formula';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(comprehensionMultiplier(0) === 0, '0/3 → 0');
assert(comprehensionMultiplier(1) === 0, '1/3 → 0');
assert(comprehensionMultiplier(2) === 1, '2/3 → 1');
assert(comprehensionMultiplier(3) === 1.25, '3/3 → 1.25');

assert(wpmMultiplier(300) === 1, '300 WPM → 1.0');
assert(wpmMultiplier(400) === 1, '400 WPM → 1.0');
assert(Math.abs(wpmMultiplier(900) - 1.3) < 1e-9, '900 WPM → 1.3');

const fiveHonest = 5 * computeLevelScore({
  baseXp: BASE_XP_DEFAULT,
  questionsCorrect: 2,
  wpm: 300,
});
const oneSpeed = computeLevelScore({
  baseXp: BASE_XP_DEFAULT,
  questionsCorrect: 3,
  wpm: 900,
});
assert(fiveHonest > oneSpeed, `five 300 WPM (${fiveHonest}) should beat one 900 WPM (${oneSpeed})`);
assert(computeLevelScore({ questionsCorrect: 1, wpm: 900 }) === 0, 'unverified → 0');

const streak = nextStreakState('2026-07-21', '2026-07-22', 3, 5);
assert(streak.current_streak === 4 && streak.isNewStreakDay, 'streak continues');

const sameDay = nextStreakState('2026-07-22', '2026-07-22', 4, 5);
assert(!sameDay.isNewStreakDay && sameDay.current_streak === 4, 'same day no bonus');

console.log('scoring formula selftest OK', { fiveHonest, oneSpeed });
