export const VIRAL_TEST_MARKER = '__VIRAL_READING_TEST__';

export const VIRAL_TEST_DURATION_SEC = 30;

export const VIRAL_TEST_WPM = 300;

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

export function getViralTestShareMessage(wpm: number, percentile: number): string {
  return `I scored ${wpm} WPM on the Speed Reader challenge — faster than ${percentile}% of readers. Can you beat me?`;
}
