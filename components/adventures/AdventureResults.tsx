'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import type { AdventureCompleteResult } from '@/lib/adventures/types';
import { trackEvent } from '@/lib/analytics';
import CliffhangerGate from '@/components/CliffhangerGate';
import './adventure-theme.css';

interface AdventureResultsProps {
  result: AdventureCompleteResult;
  storySlug: string;
  onRetry: () => void;
  onSignup?: () => void;
  onSubscribe?: () => void;
  onNextChapter?: () => void;
}

export default function AdventureResults({
  result,
  storySlug,
  onRetry,
  onSignup,
  onSubscribe,
  onNextChapter,
}: AdventureResultsProps) {
  const continueGate = result.continue_gate ?? (result.requires_auth ? 'signup' : 'none');
  const showCliffhanger = continueGate === 'signup' || continueGate === 'subscription';

  useEffect(() => {
    if (result.chapter_number === 1) {
      trackEvent('chapter_1_complete', {
        track: 'kids',
        chapter_id: result.chapter_id,
        story_slug: result.story_slug,
        passed: result.passed,
        continue_gate: continueGate,
      });
    }
  }, [
    result.chapter_number,
    result.chapter_id,
    result.story_slug,
    result.passed,
    continueGate,
  ]);

  return (
    <div className="adventure-bg min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {result.story_completed ? (
          <>
            <p className="text-xs text-amber-400 uppercase tracking-widest mb-2">Story Complete</p>
            <h2 className="text-2xl font-bold mb-2 text-emerald-400">You found the Crystal Dragon</h2>
          </>
        ) : (
          <>
            <p className="text-xs text-cyan-400 uppercase tracking-widest mb-2">Chapter Complete</p>
            <h2 className="text-2xl font-bold mb-2">{result.chapter_title}</h2>
          </>
        )}

        {result.reward_name && (
          <div className="adventure-card adventure-portal-glow rounded-xl p-5 mb-6">
            <p className="text-sm text-gray-400 mb-1">You found a clue</p>
            <p className="text-xl font-bold text-amber-400">✨ {result.reward_name}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6 text-left text-sm">
          <div className="adventure-card rounded-lg p-3">
            <p className="text-xs text-gray-500">Quiz</p>
            <p className="font-bold tabular-nums">
              {result.questions_correct}/{result.questions_total}
            </p>
          </div>
          <div className="adventure-card rounded-lg p-3">
            <p className="text-xs text-gray-500">Understanding</p>
            <p className="font-bold tabular-nums">{result.comprehension_pct}%</p>
          </div>
        </div>

        {showCliffhanger ? (
          <CliffhangerGate
            track="kids"
            gate={continueGate}
            nextTitle={result.next_chapter_title}
            onPrimary={() => {
              if (continueGate === 'signup') onSignup?.();
              else onSubscribe?.();
            }}
          />
        ) : (
          <>
            {result.xp_awarded > 0 && (
              <p className="text-lg font-bold text-amber-400 mb-4">+{result.xp_awarded} XP</p>
            )}
            {!result.passed && (
              <p className="text-sm text-gray-400 mb-4">
                Good try! Retry to unlock the next chapter.
              </p>
            )}
          </>
        )}

        <div className="space-y-3">
          {showCliffhanger && (
            <button
              onClick={onRetry}
              className="w-full px-6 py-3 adventure-card text-white font-medium rounded-lg"
            >
              Try Again
            </button>
          )}

          {!showCliffhanger && result.passed && result.next_chapter_slug && onNextChapter && (
            <button
              onClick={onNextChapter}
              className="w-full px-6 py-3 adventure-btn-primary text-white font-semibold rounded-lg"
            >
              Next Chapter →
            </button>
          )}

          {!showCliffhanger && (
            <button
              onClick={onRetry}
              className="w-full px-6 py-3 adventure-card text-white font-medium rounded-lg hover:border-emerald-400/40"
            >
              Retry Chapter
            </button>
          )}

          <Link
            href={`/adventures/${storySlug}`}
            className="block text-sm text-gray-400 hover:text-cyan-300 pt-2"
          >
            Back to story
          </Link>
        </div>
      </div>
    </div>
  );
}
