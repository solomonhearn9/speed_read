'use client';

import { useReadingStore } from '@/lib/store';
import { useMemo } from 'react';

export default function PageView() {
  const {
    rawText,
    processedWords,
    currentIndex,
    jumpToWord,
    setViewMode,
    reset,
  } = useReadingStore();

  // Map processed words to their positions in the raw text
  const wordMap = useMemo(() => {
    const map = new Map<number, number>(); // word index -> position in raw text
    let searchPos = 0;
    
    processedWords.forEach((word, index) => {
      const pos = rawText.indexOf(word.text, searchPos);
      if (pos !== -1) {
        map.set(index, pos);
        searchPos = pos + word.text.length;
      }
    });
    
    return map;
  }, [rawText, processedWords]);

  const handleWordClick = (index: number) => {
    if (index >= 0 && index < processedWords.length) {
      jumpToWord(index);
    }
  };

  // Render text with clickable words
  const renderText = () => {
    if (processedWords.length === 0) return null;

    const elements: JSX.Element[] = [];
    let lastPos = 0;

    processedWords.forEach((word, index) => {
      const wordPos = wordMap.get(index);
      if (wordPos === undefined) return;

      // Add text before this word
      if (wordPos > lastPos) {
        const beforeText = rawText.slice(lastPos, wordPos);
        elements.push(
          <span key={`before-${index}`}>{beforeText}</span>
        );
      }

      // Add the word itself
      const isCurrentWord = index === currentIndex;
      elements.push(
        <span
          key={`word-${index}`}
          onClick={() => handleWordClick(index)}
          className={`
            cursor-pointer hover:bg-gray-800 px-1 rounded transition-colors inline-block
            ${isCurrentWord ? 'bg-yellow-500/30 text-yellow-300 font-semibold ring-2 ring-yellow-500/50' : 'text-white'}
          `}
        >
          {word.text}
        </span>
      );

      lastPos = wordPos + word.text.length;
    });

    // Add remaining text
    if (lastPos < rawText.length) {
      elements.push(
        <span key="after">{rawText.slice(lastPos)}</span>
      );
    }

    return elements;
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Full Text View</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('reading')}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
            >
              Resume Reading
            </button>
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
            >
              New Content
            </button>
          </div>
        </div>

        {/* Text content */}
        <div className="prose prose-invert max-w-none">
          <div className="text-lg leading-relaxed whitespace-pre-wrap">
            {renderText()}
          </div>
        </div>

        {/* Current word indicator */}
        {currentIndex < processedWords.length && (
          <div className="mt-8 p-4 bg-gray-900 rounded-lg border border-gray-800">
            <p className="text-sm text-gray-400 mb-2">Current Position:</p>
            <p className="text-lg">
              Word {currentIndex + 1} of {processedWords.length}: "
              <span className="text-yellow-300 font-semibold">
                {processedWords[currentIndex]?.text}
              </span>
              "
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Click any word to jump to that position
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

