'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { processText } from '@/lib/textProcessor';
import WordDisplay from '@/components/WordDisplay';
import './adventure-theme.css';

const COUNTDOWN_SECONDS = 3;

interface AdventureReaderProps {
  storyTitle: string;
  chapterTitle: string;
  chapterNumber: number;
  totalChapters: number;
  passageBody: string;
  targetWpm: number;
  readerLevel?: number;
  totalXp?: number;
  storySlug: string;
  onComplete: (stats: { wordsRead: number; elapsedSeconds: number }) => void;
}

function createInitialRefs(body: string, wpm: number) {
  return {
    processedWords: processText(body, wpm),
    currentIndex: 0,
    isPlaying: false,
    activeMs: 0,
    completed: false,
    playStart: null as number | null,
  };
}

export default function AdventureReader({
  storyTitle,
  chapterTitle,
  chapterNumber,
  totalChapters,
  passageBody,
  targetWpm,
  readerLevel,
  totalXp,
  storySlug,
  onComplete,
}: AdventureReaderProps) {
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
    if (intervalRef.current) clearTimeout(intervalRef.current);
    onComplete({
      wordsRead: r.currentIndex + 1,
      elapsedSeconds: Math.max(1, Math.round(r.activeMs / 1000)),
    });
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
    if (r.isPlaying) r.playStart = Date.now();
    else if (r.playStart !== null) {
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
  }, [countdown, bump]);

  useEffect(() => {
    const r = refs.current;
    if (!r.isPlaying || countdown !== null) {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      return;
    }
    const word = r.processedWords[r.currentIndex];
    if (!word) return;
    intervalRef.current = setTimeout(nextWord, word.duration);
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [renderTick, countdown, nextWord]);

  const r = refs.current;
  const isCountingDown = countdown !== null;
  const progress =
    r.processedWords.length > 0 && !isCountingDown
      ? ((r.currentIndex + 1) / r.processedWords.length) * 100
      : 0;

  return (
    <div className="adventure-bg relative min-h-screen">
      <div
        className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-3 pb-2 bg-[#0a1628]/95 backdrop-blur-sm border-b border-emerald-500/20"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <Link
          href={`/adventures/${storySlug}`}
          className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-cyan-300"
          aria-label="Back to story"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="flex-1 min-w-0 text-center px-1">
          <p className="text-[10px] text-cyan-400/70 truncate">{storyTitle}</p>
          <p className="text-xs text-white font-medium truncate">{chapterTitle}</p>
          <p className="text-[10px] text-gray-500">
            Chapter {chapterNumber}/{totalChapters}
            {readerLevel !== undefined && (
              <span className="ml-2 text-amber-400/80">Lv {readerLevel} · {totalXp} XP</span>
            )}
          </p>
        </div>

        <button
          onClick={resetSession}
          className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-cyan-300"
          aria-label="Restart chapter"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {!isCountingDown && r.processedWords[r.currentIndex] && (
        <WordDisplay word={r.processedWords[r.currentIndex]} showGuideLines={false} />
      )}

      {isCountingDown && (
        <div
          className="fixed inset-0 z-20 flex flex-col items-center bg-[#0a1628] pointer-events-none"
          style={{ paddingTop: 'max(22vh, 7rem)' }}
        >
          <p className="text-cyan-400/70 text-sm uppercase tracking-widest mb-6">Adventure begins</p>
          <p className="text-[9rem] leading-none font-bold text-emerald-400 tabular-nums">{countdown}</p>
        </div>
      )}

      <div
        className="fixed bottom-0 left-0 right-0 z-30 bg-[#0a1628]/95 border-t border-emerald-500/20 px-4 pt-4"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <p className="text-center text-xs text-gray-500 mb-3">
          Reading pace <span className="text-cyan-400 font-semibold tabular-nums">{targetWpm}</span> WPM
        </p>
        <div className="mb-4 max-w-md mx-auto">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Progress</span>
            <span className="tabular-nums">
              {isCountingDown ? 0 : r.currentIndex + 1} / {r.processedWords.length}
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <div className="h-full adventure-xp-bar transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="flex justify-center">
          <button
            onClick={togglePlay}
            disabled={isCountingDown}
            className="p-4 adventure-btn-primary text-white rounded-full disabled:opacity-40"
            aria-label={r.isPlaying ? 'Pause' : 'Play'}
          >
            {r.isPlaying ? (
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
