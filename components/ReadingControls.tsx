'use client';

import { useReadingStore } from '@/lib/store';

export default function ReadingControls() {
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
  } = useReadingStore();

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseInt(e.target.value);
    setSpeed(newSpeed);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-gray-800 p-6">
      <p className="text-center text-xs text-gray-500 uppercase tracking-widest mb-2">
        wpm <span className="tabular-nums">{speedWPM}</span>
      </p>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Progress: {Math.round(progress)}%</span>
          <span>{currentIndex + 1} / {processedWords.length}</span>
        </div>
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={previousSentence}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Previous sentence (←)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          onClick={previousWord}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Previous word"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={togglePlay}
          className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
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
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Next word"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={nextSentence}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Next sentence (→)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Speed control */}
      <div className="flex items-center justify-center gap-4">
        <span className="text-gray-400 text-sm">100</span>
        <div className="flex-1 max-w-md">
          <input
            type="range"
            min="100"
            max="1000"
            value={speedWPM}
            onChange={handleSpeedChange}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>
        <span className="text-gray-400 text-sm">1000</span>
      </div>

      {/* View mode toggle and reset */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={() => setViewMode('page')}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          title="View full text (ESC)"
        >
          Full Text View
        </button>
        <button
          onClick={() => {
            useReadingStore.getState().reset();
          }}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          title="Load new content"
        >
          New Content
        </button>
      </div>
    </div>
  );
}

