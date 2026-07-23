/**
 * Persistence-dominant league scoring.
 *
 * Design intent (tune with real data):
 * - Five verified ~300 WPM runs should outscore one 900 WPM run.
 * - At defaults: 5 × (25 × 1.0 × 1.0) = 125 vs 1 × (25 × 1.25 × 1.3) ≈ 40.6
 *
 * FLAG FOR TUNING: wpm multiplier cap (1.3), WPM floor/ceiling (400/900),
 * comprehension 3/3 bump (1.25), and daily streak bonus (10).
 */

export const BASE_XP_DEFAULT = 25;
export const DAILY_STREAK_BONUS_XP = 10;

/** Mild WPM scaling: 1.0 at ≤400, linear to 1.3 at ≥900. */
export const WPM_MULT_FLOOR = 1.0;
export const WPM_MULT_CEILING = 1.3;
export const WPM_FLOOR = 400;
export const WPM_CEILING = 900;

export function comprehensionMultiplier(questionsCorrect: number): number {
  if (questionsCorrect <= 1) return 0;
  if (questionsCorrect === 2) return 1.0;
  return 1.25; // 3/3
}

export function wpmMultiplier(wpm: number): number {
  if (wpm <= WPM_FLOOR) return WPM_MULT_FLOOR;
  if (wpm >= WPM_CEILING) return WPM_MULT_CEILING;
  const t = (wpm - WPM_FLOOR) / (WPM_CEILING - WPM_FLOOR);
  return WPM_MULT_FLOOR + t * (WPM_MULT_CEILING - WPM_MULT_FLOOR);
}

export function computeLevelScore(params: {
  baseXp?: number;
  questionsCorrect: number;
  wpm: number;
}): number {
  const baseXp = params.baseXp ?? BASE_XP_DEFAULT;
  const c = comprehensionMultiplier(params.questionsCorrect);
  if (c === 0) return 0;
  return roundScore(baseXp * c * wpmMultiplier(params.wpm));
}

export function roundScore(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Pure streak date helper (UTC calendar days). */
export function nextStreakState(
  lastActiveDate: string | null,
  today: string,
  currentStreak: number,
  bestStreak: number
): { current_streak: number; best_streak: number; isNewStreakDay: boolean } {
  if (lastActiveDate === today) {
    return {
      current_streak: currentStreak,
      best_streak: bestStreak,
      isNewStreakDay: false,
    };
  }

  let next = 1;
  if (lastActiveDate) {
    const yesterday = utcYesterday(today);
    next = lastActiveDate === yesterday ? currentStreak + 1 : 1;
  }

  return {
    current_streak: next,
    best_streak: Math.max(bestStreak, next),
    isNewStreakDay: true,
  };
}

function utcYesterday(todayIsoDate: string): string {
  const d = new Date(`${todayIsoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}
