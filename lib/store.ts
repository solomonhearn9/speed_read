import { create } from 'zustand';
import { ProcessedWord, processText } from './textProcessor';

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
  reset: () => void;
}

export const useReadingStore = create<ReadingState>((set, get) => ({
  rawText: '',
  processedWords: [],
  currentIndex: 0,
  isPlaying: false,
  speedWPM: 250,
  viewMode: 'reading',
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

  reset: () => {
    set({
      rawText: '',
      processedWords: [],
      currentIndex: 0,
      isPlaying: false,
      progress: 0,
      viewMode: 'reading',
    });
  },
}));

