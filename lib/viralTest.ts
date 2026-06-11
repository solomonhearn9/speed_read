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
Your brain can read faster than you think. This is a thirty second speed reading challenge. Focus on the red letter in each word and let your peripheral vision handle the rest.

Most adults read about two hundred words per minute. Speed readers often double that by quieting the voice in their head and keeping their eyes still instead of jumping across the page.

This method is called Rapid Serial Visual Presentation. When each word appears in the same spot, your brain stops searching and starts absorbing. Stay relaxed and trust the pace.

Do not mouth words silently. Do not reread. Let each word arrive and move on. Your mind is built for pattern recognition far beyond what everyday reading demands.

Eye movements waste nearly half of normal reading time. Fixed point reading removes that waste. What feels fast at first soon feels natural with practice.

Faster reading often improves focus because your mind has no time to wander. Every word demands attention for just a fraction of a second.

When the timer stops you will see your score and percentile. How fast can you read in thirty seconds? Stay locked in until time runs out.`;

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

export function formatViralTestResultSummary(
  wpm: number,
  percentile: number,
  wordsRead: number,
  durationSec: number
): string {
  return `${wpm} WPM faster than ${percentile}% of readers · ${wordsRead} words in ${durationSec}s`;
}

export function getViralTestShareMessage(wpm: number, percentile: number): string {
  return `${wpm} WPM faster than ${percentile}% of readers. Can you beat me?`;
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
