'use client';

import { useReadingStore } from '@/lib/store';
import { VIRAL_TEST_DURATION_SEC } from '@/lib/viralTest';
import { getWpmTierColor } from '@/lib/theme/wpmColors';

interface ReadingControlsProps {
  viralSecondsRemaining?: number;
  viralElapsedMs?: number;
}

export default function ReadingControls({ viralSecondsRemaining, viralElapsedMs }: ReadingControlsProps) {
  const {
    isPlaying,
    togglePlay,
    previousWord,
    nextWord,
    previousSentence,
    nextSentence,
    speedWPM,
    setSpeed,
    progress,
    processedWords,
    currentIndex,
    setViewMode,
    sessionMode,
  } = useReadingStore();

  const isViralTest = sessionMode === 'viral_test';
  const viralTimeProgress = viralElapsedMs !== undefined
    ? Math.min(100, (viralElapsedMs / (VIRAL_TEST_DURATION_SEC * 1000)) * 100)
    : 0;

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseInt(e.target.value);
    setSpeed(newSpeed);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 challenge-panel p-6">
      <p
        className={`text-center uppercase tracking-widest mb-2 ${
          isViralTest
            ? 'text-sm text-white font-semibold'
            : 'text-xs challenge-text-muted'
        }`}
      >
        {isViralTest ? (
          <>
            <span className="challenge-text-muted font-normal text-xs mr-2">Speed</span>
            <span
              key={speedWPM}
              className="tabular-nums text-xl font-bold transition-colors duration-300"
              style={{ color: getWpmTierColor(speedWPM) }}
            >
              {speedWPM} WPM
            </span>
          </>
        ) : (
          <>
            wpm{' '}
            <span className="tabular-nums" style={{ color: getWpmTierColor(speedWPM) }}>
              {speedWPM}
            </span>
          </>
        )}
      </p>

      <div className="mb-4">
        <div className="flex justify-between text-sm challenge-text-muted mb-2">
          {isViralTest && viralSecondsRemaining !== undefined ? (
            <>
              <span className="text-slate-300 font-medium">Challenge</span>
              <span className="tabular-nums text-white">{viralSecondsRemaining}s left</span>
            </>
          ) : (
            <>
              <span>Progress: {Math.round(progress)}%</span>
              <span>{currentIndex + 1} / {processedWords.length}</span>
            </>
          )}
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full bg-challenge-cta rounded-full ${isViralTest ? '' : 'transition-all duration-300'}`}
            style={{ width: `${isViralTest ? viralTimeProgress : progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={previousSentence}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Previous sentence (←)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={previousWord}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Previous word"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={togglePlay}
          className="p-4 bg-challenge-cta hover:bg-challenge-cta-hover text-white rounded-full transition-colors shadow-lg shadow-red-500/20"
          title="Play/Pause (Space)"
        >
          {isPlaying ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={nextWord}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Next word"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={nextSentence}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Next sentence (→)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {!isViralTest && (
        <div className="flex items-center justify-center gap-4">
          <span className="challenge-text-muted text-sm">100</span>
          <div className="flex-1 max-w-md">
            <input
              type="range"
              min="100"
              max="1000"
              value={speedWPM}
              onChange={handleSpeedChange}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-challenge-cta"
            />
          </div>
          <span className="challenge-text-muted text-sm">1000</span>
        </div>
      )}

      {!isViralTest && (
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => setViewMode('page')}
            className="px-4 py-2 text-sm challenge-text-muted hover:text-accent-red transition-colors"
            title="View full text (ESC)"
          >
            Full Text View
          </button>
          <button
            onClick={() => {
              useReadingStore.getState().reset();
            }}
            className="px-4 py-2 text-sm challenge-text-muted hover:text-accent-red transition-colors"
            title="Load new content"
          >
            New Content
          </button>
        </div>
      )}
    </div>
  );
}
