'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { processText } from '@/lib/textProcessor';
import WordDisplay from '@/components/WordDisplay';

const COUNTDOWN_SECONDS = 3;

interface TrainingReaderProps {
  passageTitle: string;
  passageBody: string;
  targetWpm: number;
  onComplete: (stats: { wordsRead: number; elapsedSeconds: number }) => void;
}

function createInitialRefs(passageBody: string, targetWpm: number) {
  return {
    processedWords: processText(passageBody, targetWpm),
    currentIndex: 0,
    isPlaying: false,
    activeMs: 0,
    completed: false,
    playStart: null as number | null,
  };
}

export default function TrainingReader({
  passageTitle,
  passageBody,
  targetWpm,
  onComplete,
}: TrainingReaderProps) {
  const [sessionId, setSessionId] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(COUNTDOWN_SECONDS);
  const [renderTick, setRenderTick] = useState(0);

  const refs = useRef(createInitialRefs(passageBody, targetWpm));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const bump = useCallback(() => setRenderTick((n) => n + 1), []);

  const resetSession = useCallback(() => {
    if (intervalRef.current) clearTimeout(intervalRef.current);
    if (countdownRef.current) clearTimeout(countdownRef.current);
    refs.current = createInitialRefs(passageBody, targetWpm);
    setCountdown(COUNTDOWN_SECONDS);
    setSessionId((id) => id + 1);
    bump();
  }, [passageBody, targetWpm, bump]);

  const finish = useCallback(() => {
    const r = refs.current;
    if (r.completed) return;
    r.completed = true;
    r.isPlaying = false;
    if (r.playStart !== null) {
      r.activeMs += Date.now() - r.playStart;
      r.playStart = null;
    }
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    const wordsRead = r.currentIndex + 1;
    const elapsedSeconds = Math.max(1, Math.round(r.activeMs / 1000));
    onComplete({ wordsRead, elapsedSeconds });
    bump();
  }, [onComplete, bump]);

  const nextWord = useCallback(() => {
    const r = refs.current;
    if (r.currentIndex < r.processedWords.length - 1) {
      r.currentIndex += 1;
      bump();
    } else {
      finish();
    }
  }, [finish, bump]);

  const togglePlay = useCallback(() => {
    if (countdown !== null) return;
    const r = refs.current;
    r.isPlaying = !r.isPlaying;
    if (r.isPlaying) {
      r.playStart = Date.now();
    } else if (r.playStart !== null) {
      r.activeMs += Date.now() - r.playStart;
      r.playStart = null;
    }
    bump();
  }, [countdown, bump]);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      setCountdown(null);
      const r = refs.current;
      r.isPlaying = true;
      r.playStart = Date.now();
      bump();
      return;
    }

    countdownRef.current = setTimeout(() => {
      setCountdown((c) => (c !== null && c > 0 ? c - 1 : null));
    }, 1000);

    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, [countdown, sessionId, bump]);

  useEffect(() => {
    const r = refs.current;
    if (!r.isPlaying || countdown !== null || r.processedWords.length === 0) {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const word = r.processedWords[r.currentIndex];
    if (!word) return;

    intervalRef.current = setTimeout(() => {
      nextWord();
    }, word.duration);

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [renderTick, countdown, nextWord]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [togglePlay]);

  const r = refs.current;
  const words = r.processedWords;
  const currentIndex = r.currentIndex;
  const isPlaying = r.isPlaying;
  const isCountingDown = countdown !== null;
  const displayIndex = isCountingDown ? 0 : currentIndex + 1;
  const progress =
    words.length > 0 && !isCountingDown ? (displayIndex / words.length) * 100 : 0;
  const currentWord = words[currentIndex];

  if (!currentWord) return null;

  return (
    <div data-theme="reader" className="relative min-h-screen bg-reader-bg" key={sessionId}>
      <div
        className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-3 pb-2 md:px-6 md:pt-4 bg-reader-surface/90 backdrop-blur-sm border-b border-reader-border"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <Link
          href="/train"
          className="flex items-center justify-center w-10 h-10 text-slate-400 hover:text-white transition-colors rounded-lg"
          aria-label="Back to training path"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="flex-1 min-w-0 text-center px-2">
          <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest">Training</p>
          <p className="text-xs md:text-sm text-white font-medium truncate">{passageTitle}</p>
        </div>

        <button
          onClick={resetSession}
          className="flex items-center justify-center w-10 h-10 text-slate-400 hover:text-white transition-colors rounded-lg"
          aria-label="Restart level"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {!isCountingDown && (
        <WordDisplay word={currentWord} showGuideLines={false} variant="training" />
      )}

      {isCountingDown && (
        <div
          className="fixed inset-0 z-20 flex flex-col items-center pointer-events-none bg-reader-bg"
          style={{ paddingTop: 'max(22vh, 7rem)' }}
        >
          <p className="text-slate-500 text-sm uppercase tracking-widest mb-6">Get ready</p>
          <p className="text-[9rem] leading-none md:text-[11rem] font-bold text-brand tabular-nums">
            {countdown}
          </p>
        </div>
      )}

      <div
        className="fixed bottom-0 left-0 right-0 z-30 bg-reader-surface/90 backdrop-blur-sm border-t border-reader-border px-4 pt-4 md:px-6 md:pb-8"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <p className="text-center text-xs text-slate-500 mb-3">
          Target{' '}
          <span className="text-brand font-semibold tabular-nums">{targetWpm}</span> WPM
        </p>

        <div className="mb-4 max-w-md mx-auto">
          <div className="flex justify-between text-xs md:text-sm text-slate-400 mb-1.5">
            <span>Progress</span>
            <span className="tabular-nums">
              {isCountingDown ? 0 : currentIndex + 1} / {words.length}
            </span>
          </div>
          <div className="w-full h-1.5 bg-reader-border rounded-full overflow-hidden">
            <div
              className="h-full bg-brand transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={togglePlay}
            disabled={isCountingDown}
            className="p-4 bg-brand hover:bg-brand-hover disabled:bg-reader-border disabled:opacity-50 text-white rounded-full transition-colors shadow-badge"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
