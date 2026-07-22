export const VIRAL_TEST_MARKER = '__VIRAL_READING_TEST__';

export const VIRAL_TEST_DURATION_SEC = 30;

/** Progressive challenge speeds: easy start, ramp through the 30-second window. */
export const VIRAL_TEST_SPEED_SCHEDULE: ReadonlyArray<{ wpm: number; durationSec: number }> = [
  { wpm: 100, durationSec: 3 },
  { wpm: 200, durationSec: 3 },
  { wpm: 350, durationSec: 4 },
  { wpm: 500, durationSec: 6 },
  { wpm: 700, durationSec: 5 },
  { wpm: 900, durationSec: 9 },
];

export const VIRAL_TEST_INITIAL_WPM = VIRAL_TEST_SPEED_SCHEDULE[0].wpm;

export function getViralTestWpmAtElapsedMs(elapsedMs: number): number {
  let cumulativeMs = 0;
  for (const phase of VIRAL_TEST_SPEED_SCHEDULE) {
    cumulativeMs += phase.durationSec * 1000;
    if (elapsedMs < cumulativeMs) {
      return phase.wpm;
    }
  }
  return VIRAL_TEST_SPEED_SCHEDULE[VIRAL_TEST_SPEED_SCHEDULE.length - 1].wpm;
}

export const VIRAL_TEST_TEXT = `${VIRAL_TEST_MARKER}
Your brain can read faster than you think. This is a thirty second speed reading challenge. Focus on the blue letter in each word and let your peripheral vision handle the rest.

Most adults read about two hundred words per minute. Speed readers often double that by quieting the voice in their head and keeping their eyes still instead of jumping across the page.

This method is called Rapid Serial Visual Presentation. When each word appears in the same spot, your brain stops searching and starts absorbing. Stay relaxed and trust the pace.

Do not mouth words silently. Do not reread. Let each word arrive and move on. Your mind is built for pattern recognition far beyond what everyday reading demands.

Eye movements waste nearly half of normal reading time. Fixed point reading removes that waste. What feels fast at first soon feels natural with practice.

Faster reading often improves focus because your mind has no time to wander. Every word demands attention for just a fraction of a second.

When the timer stops, a short comprehension check confirms what stuck. How fast can you read in thirty seconds? Stay locked in until time runs out.`;

export function isViralTestText(text: string): boolean {
  return text.trimStart().startsWith(VIRAL_TEST_MARKER);
}

export function getViralTestPassage(text: string): string {
  return text.replace(VIRAL_TEST_MARKER, '').trim();
}

export function calculateViralTestWpm(wordsRead: number, durationSec: number): number {
  if (durationSec <= 0) return 0;
  return Math.round((wordsRead / durationSec) * 60);
}

/** Score is the speed tier reached in the challenge ramp, not words-per-minute throughput. */
export function getViralTestScoreWpm(elapsedMs: number): number {
  return getViralTestWpmAtElapsedMs(elapsedMs);
}

/** Retry speed after a weak comprehension result — find the reader's actual edge. */
export function getViralTestRetryWpm(challengeWpm: number): number {
  return Math.max(100, Math.round(challengeWpm * 0.8));
}

export type ViralTestRevealTier = 'verified' | 'confirmed' | 'retry';

export function getViralTestRevealTier(correct: number): ViralTestRevealTier {
  if (correct >= 3) return 'verified';
  if (correct === 2) return 'confirmed';
  return 'retry';
}

/** Speed-based badge name. Verified (3/3) appends "— Verified". */
export function getViralTestTierName(wpm: number): string {
  if (wpm >= 900) return 'Machine';
  if (wpm >= 700) return 'Blitz';
  if (wpm >= 500) return 'Rocket';
  if (wpm >= 350) return 'Swift';
  if (wpm >= 200) return 'Steady';
  return 'Starter';
}

export function getViralTestBadgeLabel(wpm: number, revealTier: ViralTestRevealTier): string | null {
  if (revealTier === 'retry') return null;
  const name = getViralTestTierName(wpm);
  return revealTier === 'verified' ? `${name} — Verified` : name;
}

export function getViralTestRevealHeadline(
  wpm: number,
  revealTier: ViralTestRevealTier
): string {
  if (revealTier === 'verified') {
    return `Confirmed: ${wpm} WPM, full comprehension`;
  }
  if (revealTier === 'confirmed') {
    return `Confirmed: ${wpm} WPM`;
  }
  return `The words moved at ${wpm} WPM, but that one got away from you. Try again at your real speed?`;
}

export function formatViralTestResultSummary(
  wpm: number,
  percentile: number,
  wordsRead: number,
  durationSec: number
): string {
  return `${wpm} WPM faster than ${percentile}% of readers · ${wordsRead} words in ${durationSec}s`;
}

export function getViralTestShareMessage(
  wpm: number,
  percentile: number,
  options?: { comprehensionPct?: number; fullComprehension?: boolean }
): string {
  if (options?.fullComprehension) {
    return `Confirmed: ${wpm} WPM, full comprehension. Faster than ${percentile}% of readers. Can you beat me?`;
  }
  const compPart =
    options?.comprehensionPct != null ? ` · ${options.comprehensionPct}% comprehension` : '';
  return `${wpm} WPM faster than ${percentile}% of readers${compPart}. Can you beat me?`;
}

/** Seconds allowed to answer each comprehension question (anti-lookup). */
export const VIRAL_TEST_QUIZ_QUESTION_SEC = 9;

export interface ViralTestQuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export const VIRAL_TEST_QUIZ_QUESTIONS: ViralTestQuizQuestion[] = [
  {
    id: 'vt-q1',
    prompt: 'What reading method does this challenge use?',
    options: [
      'Left-to-right page scanning',
      'Audio narration only',
      'Rapid Serial Visual Presentation (RSVP)',
      'Highlight-and-skim',
    ],
    correctIndex: 2,
  },
  {
    id: 'vt-q2',
    prompt: 'What should you focus on in each word during the challenge?',
    options: [
      'The first letter only',
      'The blue letter (Optimal Recognition Point)',
      'The last letter only',
      'The word length',
    ],
    correctIndex: 1,
  },
  {
    id: 'vt-q3',
    prompt: 'According to the passage, what slows most people down when reading normally?',
    options: [
      'Screen brightness',
      'Font size',
      'Paragraph length',
      'Eye movements (saccades) between words',
    ],
    correctIndex: 3,
  },
];

export function gradeViralTestQuiz(
  answers: Array<{ question_id: string; selected_index: number }>
): { correct: number; total: number; pct: number } {
  const answerMap = new Map(answers.map((a) => [a.question_id, a.selected_index]));
  let correct = 0;
  for (const q of VIRAL_TEST_QUIZ_QUESTIONS) {
    if (answerMap.get(q.id) === q.correctIndex) correct += 1;
  }
  const total = VIRAL_TEST_QUIZ_QUESTIONS.length;
  return { correct, total, pct: total > 0 ? Math.round((correct / total) * 100) : 0 };
}

const PERCENTILE_BREAKPOINTS: [number, number][] = [
  [100, 8],
  [150, 20],
  [200, 42],
  [238, 50],
  [275, 62],
  [300, 74],
  [350, 84],
  [400, 91],
  [450, 95],
  [500, 97],
  [600, 99],
  [800, 99],
  [900, 99],
];

export function calculatePercentile(wpm: number): number {
  if (wpm <= PERCENTILE_BREAKPOINTS[0][0]) return PERCENTILE_BREAKPOINTS[0][1];
  if (wpm >= PERCENTILE_BREAKPOINTS[PERCENTILE_BREAKPOINTS.length - 1][0]) {
    return PERCENTILE_BREAKPOINTS[PERCENTILE_BREAKPOINTS.length - 1][1];
  }

  for (let i = 0; i < PERCENTILE_BREAKPOINTS.length - 1; i++) {
    const [wpmLow, pctLow] = PERCENTILE_BREAKPOINTS[i];
    const [wpmHigh, pctHigh] = PERCENTILE_BREAKPOINTS[i + 1];
    if (wpm >= wpmLow && wpm <= wpmHigh) {
      const ratio = (wpm - wpmLow) / (wpmHigh - wpmLow);
      return Math.round(pctLow + ratio * (pctHigh - pctLow));
    }
  }

  return 50;
}
