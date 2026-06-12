export const XP_FIRST_COMPLETION_BONUS = 10;
export const READER_LEVEL_XP_STEP = 100;

export interface XpBreakdown {
  base: number;
  passBonus: number;
  masteryBonus: number;
  firstCompletionBonus: number;
  total: number;
}

export function calculateXpAward(params: {
  xpBase: number;
  xpPass: number;
  xpMastery: number;
  questionsCorrect: number;
  questionsTotal: number;
  minCorrectToPass: number;
  isFirstCompletion: boolean;
}): { xp: number; passed: boolean; mastered: boolean; breakdown: XpBreakdown } {
  const { xpBase, xpPass, xpMastery, questionsCorrect, questionsTotal, minCorrectToPass, isFirstCompletion } = params;

  const passed = questionsCorrect >= minCorrectToPass;
  const mastered = questionsCorrect === questionsTotal;

  let total = xpBase;
  const passBonus = passed ? xpPass - xpBase : 0;
  const masteryBonus = mastered ? xpMastery - (passed ? xpPass : xpBase) : 0;

  if (passed) total = xpPass;
  if (mastered) total = xpMastery;
  if (isFirstCompletion) total += XP_FIRST_COMPLETION_BONUS;

  return {
    xp: total,
    passed,
    mastered,
    breakdown: {
      base: xpBase,
      passBonus,
      masteryBonus,
      firstCompletionBonus: isFirstCompletion ? XP_FIRST_COMPLETION_BONUS : 0,
      total,
    },
  };
}

export function calculateReaderLevel(totalXp: number): number {
  return Math.max(1, Math.floor(totalXp / READER_LEVEL_XP_STEP) + 1);
}

export function calculateComprehensionPct(questionsCorrect: number, questionsTotal: number): number {
  if (questionsTotal <= 0) return 0;
  return Math.round((questionsCorrect / questionsTotal) * 100);
}

export function calculateActualWpm(wordsRead: number, elapsedSeconds: number): number {
  if (elapsedSeconds <= 0) return 0;
  return Math.round((wordsRead / elapsedSeconds) * 60);
}
