import { create } from 'zustand';
import { ProcessedWord, processText } from './textProcessor';
import {
  VIRAL_TEST_TEXT,
  VIRAL_TEST_INITIAL_WPM,
  calculatePercentile,
  getViralTestPassage,
  getViralTestRetryWpm,
  getViralTestScoreWpm,
  getViralTestRevealTier,
  type ViralTestRevealTier,
} from './viralTest';

export type SessionMode = 'normal' | 'viral_test';
export type ViralChallengePhase = 'none' | 'reading' | 'quiz' | 'results';
/** Progressive ramp for the main challenge; fixed WPM for comprehension retry. */
export type ViralTestSpeedMode = 'ramp' | 'fixed';

export interface ViralTestResults {
  wpm: number;
  percentile: number;
  wordsRead: number;
  durationSec: number;
  comprehensionCorrect: number;
  comprehensionTotal: number;
  comprehensionPct: number;
  revealTier: ViralTestRevealTier;
}

export interface ViralTestDraft {
  wpm: number;
  percentile: number;
  wordsRead: number;
  durationSec: number;
}

export interface ReadingState {
  // Content
  rawText: string;
  processedWords: ProcessedWord[];
  
  // Reading state
  currentIndex: number;
  isPlaying: boolean;
  speedWPM: number;
  
  // View mode
  viewMode: 'reading' | 'page';

  // Viral reading test
  sessionMode: SessionMode;
  viralChallengePhase: ViralChallengePhase;
  viralTestSpeedMode: ViralTestSpeedMode;
  viralTestFixedWpm: number | null;
  viralTestDraft: ViralTestDraft | null;
  viralTestResults: ViralTestResults | null;
  landingInputMethod: 'text' | 'file' | null;
  
  // Progress
  progress: number;
  
  // Actions
  setText: (text: string) => void;
  setSpeed: (wpm: number) => void;
  setCurrentIndex: (index: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  nextWord: () => void;
  previousWord: () => void;
  nextSentence: () => void;
  previousSentence: () => void;
  setViewMode: (mode: 'reading' | 'page') => void;
  jumpToWord: (index: number) => void;
  setSessionMode: (mode: SessionMode) => void;
  startViralTest: (options?: { fixedWpm?: number }) => void;
  finishViralTestReading: (wordsRead: number, elapsedSec: number, scoreWpm?: number) => void;
  completeViralTestQuiz: (comprehensionCorrect: number, comprehensionTotal: number, comprehensionPct: number) => void;
  retryViralTestAtReducedSpeed: () => void;
  clearViralTestResults: () => void;
  clearLandingInputMethod: () => void;
  returnToLanding: (inputMethod?: 'text' | 'file') => void;
  reset: () => void;
}

export const useReadingStore = create<ReadingState>((set, get) => ({
  rawText: '',
  processedWords: [],
  currentIndex: 0,
  isPlaying: false,
  speedWPM: 250,
  viewMode: 'reading',
  sessionMode: 'normal',
  viralChallengePhase: 'none',
  viralTestSpeedMode: 'ramp',
  viralTestFixedWpm: null,
  viralTestDraft: null,
  viralTestResults: null,
  landingInputMethod: null,
  progress: 0,

  setText: (text: string) => {
    const words = processText(text, get().speedWPM);
    set({
      rawText: text,
      processedWords: words,
      currentIndex: 0,
      progress: 0,
      isPlaying: false,
    });
  },

  setSpeed: (wpm: number) => {
    const currentWords = get().processedWords;
    const newWords = currentWords.length > 0
      ? processText(get().rawText, wpm)
      : currentWords;
    
    set({
      speedWPM: wpm,
      processedWords: newWords,
    });
  },

  setCurrentIndex: (index: number) => {
    const words = get().processedWords;
    const clampedIndex = Math.max(0, Math.min(index, words.length - 1));
    const progress = words.length > 0 ? (clampedIndex / words.length) * 100 : 0;
    
    set({
      currentIndex: clampedIndex,
      progress,
    });
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  nextWord: () => {
    const { currentIndex, processedWords } = get();
    if (currentIndex < processedWords.length - 1) {
      get().setCurrentIndex(currentIndex + 1);
    }
  },

  previousWord: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      get().setCurrentIndex(currentIndex - 1);
    }
  },

  nextSentence: () => {
    const { currentIndex, processedWords } = get();
    let nextIndex = currentIndex + 1;
    
    // Find next sentence end
    while (nextIndex < processedWords.length && !processedWords[nextIndex].sentenceEnd) {
      nextIndex++;
    }
    
    // Move to word after sentence end
    if (nextIndex < processedWords.length - 1) {
      get().setCurrentIndex(nextIndex + 1);
    } else {
      get().setCurrentIndex(processedWords.length - 1);
    }
  },

  previousSentence: () => {
    const { currentIndex, processedWords } = get();
    let prevIndex = currentIndex - 1;
    
    // Find previous sentence end
    while (prevIndex > 0 && !processedWords[prevIndex].sentenceEnd) {
      prevIndex--;
    }
    
    // Move to word before sentence end, or start of sentence
    if (prevIndex > 0) {
      get().setCurrentIndex(Math.max(0, prevIndex - 1));
    } else {
      get().setCurrentIndex(0);
    }
  },

  setViewMode: (mode: 'reading' | 'page') => {
    set({ viewMode: mode, isPlaying: false });
  },

  jumpToWord: (index: number) => {
    get().setCurrentIndex(index);
    set({ viewMode: 'reading' });
  },

  setSessionMode: (mode: SessionMode) => {
    set({
      sessionMode: mode,
      viralTestResults: null,
      viralTestDraft: null,
      viralChallengePhase: 'none',
      viralTestSpeedMode: 'ramp',
      viralTestFixedWpm: null,
    });
  },

  startViralTest: (options) => {
    const fixedWpm = options?.fixedWpm;
    const startWpm = fixedWpm ?? VIRAL_TEST_INITIAL_WPM;
    const passage = getViralTestPassage(VIRAL_TEST_TEXT);
    const words = processText(passage, startWpm);
    set({
      rawText: passage,
      processedWords: words,
      currentIndex: 0,
      progress: 0,
      isPlaying: false,
      speedWPM: startWpm,
      viewMode: 'reading',
      sessionMode: 'viral_test',
      viralChallengePhase: 'reading',
      viralTestSpeedMode: fixedWpm != null ? 'fixed' : 'ramp',
      viralTestFixedWpm: fixedWpm ?? null,
      viralTestDraft: null,
      viralTestResults: null,
    });
  },

  finishViralTestReading: (wordsRead: number, elapsedSec: number, scoreWpm?: number) => {
    const { viralTestSpeedMode, viralTestFixedWpm } = get();
    const wpm =
      scoreWpm ??
      (viralTestSpeedMode === 'fixed' && viralTestFixedWpm != null
        ? viralTestFixedWpm
        : getViralTestScoreWpm(elapsedSec * 1000));
    const percentile = calculatePercentile(wpm);
    set({
      isPlaying: false,
      viralChallengePhase: 'quiz',
      viralTestDraft: { wpm, percentile, wordsRead, durationSec: elapsedSec },
    });
  },

  completeViralTestQuiz: (comprehensionCorrect: number, comprehensionTotal: number, comprehensionPct: number) => {
    const draft = get().viralTestDraft;
    if (!draft) return;
    set({
      viralChallengePhase: 'results',
      viralTestResults: {
        ...draft,
        comprehensionCorrect,
        comprehensionTotal,
        comprehensionPct,
        revealTier: getViralTestRevealTier(comprehensionCorrect),
      },
    });
  },

  retryViralTestAtReducedSpeed: () => {
    const results = get().viralTestResults;
    if (!results) return;
    const retryWpm = getViralTestRetryWpm(results.wpm);
    get().startViralTest({ fixedWpm: retryWpm });
  },

  clearViralTestResults: () => {
    set({
      viralTestResults: null,
      viralTestDraft: null,
      viralChallengePhase: 'none',
      viralTestSpeedMode: 'ramp',
      viralTestFixedWpm: null,
    });
  },

  clearLandingInputMethod: () => {
    set({ landingInputMethod: null });
  },

  returnToLanding: (inputMethod = 'text') => {
    set({
      rawText: '',
      processedWords: [],
      currentIndex: 0,
      isPlaying: false,
      progress: 0,
      viewMode: 'reading',
      sessionMode: 'normal',
      viralChallengePhase: 'none',
      viralTestSpeedMode: 'ramp',
      viralTestFixedWpm: null,
      viralTestDraft: null,
      viralTestResults: null,
      landingInputMethod: inputMethod,
    });
  },

  reset: () => {
    set({
      rawText: '',
      processedWords: [],
      currentIndex: 0,
      isPlaying: false,
      progress: 0,
      viewMode: 'reading',
      sessionMode: 'normal',
      viralChallengePhase: 'none',
      viralTestSpeedMode: 'ramp',
      viralTestFixedWpm: null,
      viralTestDraft: null,
      viralTestResults: null,
      landingInputMethod: null,
    });
  },
}));

