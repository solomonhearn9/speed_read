'use client';

import { useEffect, useRef, useState } from 'react';
import { useReadingStore } from '@/lib/store';
import { trackEvent } from '@/lib/analytics';
import { VIRAL_TEST_DURATION_SEC } from '@/lib/viralTest';
import WordDisplay from './WordDisplay';
import ReadingControls from './ReadingControls';

const DEMO_TEXT_START = "Let's see if you can keep up with this Speed Reading exercise";

export default function ReadingView() {
  const {
    processedWords,
    currentIndex,
    isPlaying,
    speedWPM,
    rawText,
    sessionMode,
    viralTestResults,
    nextWord,
    pause,
    setSpeed,
    completeViralTest,
  } = useReadingStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const speedChangePointsRef = useRef<Map<number, number>>(new Map());
  const lastSpeedChangeRef = useRef<number>(-1);
  const sessionCompletedRef = useRef(false);
  const lastCompletedIndexRef = useRef(-1);
  const viralActiveMsRef = useRef(0);
  const viralPlayStartRef = useRef<number | null>(null);
  const viralTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [viralSecondsRemaining, setViralSecondsRemaining] = useState(VIRAL_TEST_DURATION_SEC);

  // Viral test: track active reading time and end after 30 seconds
  useEffect(() => {
    if (sessionMode !== 'viral_test' || viralTestResults) return;

    if (isPlaying) {
      viralPlayStartRef.current = Date.now();

      const tick = () => {
        const playStart = viralPlayStartRef.current;
        if (playStart === null) return;

        const elapsedMs = viralActiveMsRef.current + (Date.now() - playStart);
        const remainingSec = Math.max(0, Math.ceil((VIRAL_TEST_DURATION_SEC * 1000 - elapsedMs) / 1000));
        setViralSecondsRemaining(remainingSec);

        if (elapsedMs >= VIRAL_TEST_DURATION_SEC * 1000) {
          const wordsRead = useReadingStore.getState().currentIndex + 1;
          const durationSec = VIRAL_TEST_DURATION_SEC;
          const wpm = Math.round((wordsRead / durationSec) * 60);
          trackEvent('viral_test_completed', { wordsRead, wpm });
          completeViralTest(wordsRead, durationSec);
          return;
        }

        viralTimerRef.current = setTimeout(tick, 100);
      };

      tick();
    } else if (viralPlayStartRef.current !== null) {
      viralActiveMsRef.current += Date.now() - viralPlayStartRef.current;
      viralPlayStartRef.current = null;
      if (viralTimerRef.current) {
        clearTimeout(viralTimerRef.current);
        viralTimerRef.current = null;
      }
    }

    return () => {
      if (viralTimerRef.current) {
        clearTimeout(viralTimerRef.current);
        viralTimerRef.current = null;
      }
    };
  }, [sessionMode, isPlaying, viralTestResults, completeViralTest]);

  useEffect(() => {
    if (sessionMode === 'viral_test' && !viralTestResults) {
      viralActiveMsRef.current = 0;
      viralPlayStartRef.current = null;
      setViralSecondsRemaining(VIRAL_TEST_DURATION_SEC);
    }
  }, [sessionMode, viralTestResults, processedWords.length]);

  // Demo mode: detect if this is demo text and calculate speed change points
  useEffect(() => {
    const isDemoText = rawText.trim().startsWith(DEMO_TEXT_START);
    if (sessionMode === 'viral_test') return;
    if (!isDemoText || processedWords.length === 0) {
      speedChangePointsRef.current.clear();
      return;
    }

    // Set initial speed to 300 WPM for demo
    if (currentIndex === 0 && speedWPM !== 300) {
      setSpeed(300);
    }

    // Calculate speed change points once when words are processed
    if (speedChangePointsRef.current.size === 0 && processedWords.length > 0) {
      const words = processedWords.map(w => w.text.toLowerCase());
      const fullText = words.join(' ');

      // Find word indices for speed change phrases
      const findPhraseIndex = (phrase: string): number | null => {
        const phraseWords = phrase.toLowerCase().split(/\s+/);
        for (let i = 0; i <= words.length - phraseWords.length; i++) {
          const slice = words.slice(i, i + phraseWords.length).join(' ');
          if (slice === phraseWords.join(' ')) {
            return i;
          }
        }
        return null;
      };

      // Map of target speeds and their phrases
      const speedPhrases = [
        { speed: 400, phrase: '400 words per minute' },
        { speed: 500, phrase: '500 words per minute' },
        { speed: 600, phrase: '600 words per minute' },
        { speed: 700, phrase: '700 words per minute' },
        { speed: 300, phrase: '300 wpm where we started' },
      ];

      speedPhrases.forEach(({ speed, phrase }) => {
        const index = findPhraseIndex(phrase);
        if (index !== null) {
          // Change speed a few words before the phrase
          speedChangePointsRef.current.set(Math.max(0, index - 2), speed);
        }
      });
    }
  }, [rawText, processedWords, currentIndex, speedWPM, setSpeed, sessionMode]);

  // Demo mode: automatically adjust speed at calculated positions
  useEffect(() => {
    if (sessionMode === 'viral_test') return;
    const isDemoText = rawText.trim().startsWith(DEMO_TEXT_START);
    if (!isDemoText || speedChangePointsRef.current.size === 0) return;

    // Check if we've reached a speed change point
    const targetSpeed = speedChangePointsRef.current.get(currentIndex);
    if (targetSpeed !== undefined && targetSpeed !== speedWPM) {
      setSpeed(targetSpeed);
      lastSpeedChangeRef.current = targetSpeed;
    }
  }, [currentIndex, rawText, speedWPM, setSpeed, sessionMode]);

  useEffect(() => {
    if (!isPlaying || processedWords.length === 0) {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const currentWord = processedWords[currentIndex];
    if (!currentWord) {
      pause();
      return;
    }

    // Set timeout for current word duration
    intervalRef.current = setTimeout(() => {
      if (currentIndex < processedWords.length - 1) {
        nextWord();
      } else {
        pause();
        if (lastCompletedIndexRef.current !== currentIndex) {
          lastCompletedIndexRef.current = currentIndex;
          sessionCompletedRef.current = true;
          trackEvent('reading_session_completed');
        }
      }
    }, currentWord.duration);

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isPlaying, currentIndex, processedWords, speedWPM, nextWord, pause]);

  useEffect(() => {
    if (currentIndex < processedWords.length - 1) {
      sessionCompletedRef.current = false;
      lastCompletedIndexRef.current = -1;
    }
  }, [currentIndex, processedWords.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const { togglePlay, previousWord, nextWord, previousSentence, nextSentence, setViewMode } = useReadingStore.getState();
      
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        previousSentence();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSentence();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newSpeed = Math.min(1000, speedWPM + 25);
        useReadingStore.getState().setSpeed(newSpeed);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newSpeed = Math.max(100, speedWPM - 25);
        useReadingStore.getState().setSpeed(newSpeed);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setViewMode('page');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [speedWPM]);

  if (processedWords.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-gray-400">
        <p>No content loaded. Please add text to begin reading.</p>
      </div>
    );
  }

  const currentWord = processedWords[currentIndex];
  if (!currentWord) {
    return null;
  }

  return (
    <div className="relative">
      <WordDisplay word={currentWord} />
      <ReadingControls
        viralSecondsRemaining={sessionMode === 'viral_test' ? viralSecondsRemaining : undefined}
      />
    </div>
  );
}


