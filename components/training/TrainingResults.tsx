'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import type { AttemptCompleteResult } from '@/lib/training/types';
import { trackEvent } from '@/lib/analytics';
import AchievementCard from './AchievementCard';
import CompletionBadge from './CompletionBadge';
import CliffhangerGate from '@/components/CliffhangerGate';

interface TrainingResultsProps {
  result: AttemptCompleteResult;
  onRetry: () => void;
  onContinueAnyway?: () => void | Promise<void>;
  onSignup?: () => void;
  onSubscribe?: () => void;
}

export default function TrainingResults({
  result,
  onRetry,
  onContinueAnyway,
  onSignup,
  onSubscribe,
}: TrainingResultsProps) {
  const masteryLabel = result.mastered
    ? 'Mastered'
    : result.passed
      ? 'Passed'
      : 'Complete';

  const continueGate = result.continue_gate ?? (result.requires_auth ? 'signup' : 'none');
  const showCliffhanger = continueGate === 'signup' || continueGate === 'subscription';
  const hasNextLevel = Boolean(result.next_level_id ?? result.next_level_wpm);
  const nextLevelLabel = result.next_level_wpm
    ? `Ready for ${result.next_level_wpm} WPM?`
    : null;

  useEffect(() => {
    if (result.level_number === 1) {
      trackEvent('chapter_1_complete', {
        track: 'adult',
        level_id: result.level_id,
        passed: result.passed,
        continue_gate: continueGate,
      });
    }
  }, [result.level_number, result.level_id, result.passed, continueGate]);

  const primaryBtnClass =
    'w-full px-6 py-3 btn-brand font-medium rounded-lg';
  const secondaryBtnClass =
    'w-full px-6 py-3 surface-card hover:border-brand/40 text-content-primary font-medium rounded-lg transition-colors';

  const renderNextLevelCta = (options?: { onClick?: () => void; secondary?: boolean }) => {
    const className = options?.secondary ? secondaryBtnClass : primaryBtnClass;

    const content = (
      <>
        <span className="block font-semibold">Next Level →</span>
        {nextLevelLabel && (
          <span
            className={`block text-sm font-normal mt-0.5 ${
              options?.secondary ? 'text-content-muted' : 'text-blue-100/90'
            }`}
          >
            {nextLevelLabel}
          </span>
        )}
      </>
    );

    if (options?.onClick) {
      return (
        <button type="button" onClick={options.onClick} className={className}>
          {content}
        </button>
      );
    }

    if (result.next_level_id) {
      return (
        <Link href={`/train/${result.next_level_id}`} className={`block ${className}`}>
          {content}
        </Link>
      );
    }

    return null;
  };

  const cardVariant = result.passed || result.mastered ? 'success' : 'default';
  const cardTitle = result.mastered
    ? 'Level Mastered!'
    : result.passed
      ? 'Level Complete'
      : 'Level Finished';

  return (
    <div data-theme="learning" className="min-h-screen bg-surface-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <AchievementCard
          variant={cardVariant}
          eyebrow={`Level ${result.level_number} · ${masteryLabel}`}
          title={cardTitle}
          subtitle={result.level_title}
          icon={
            result.passed || result.mastered ? (
              <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center">
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : undefined
          }
        >
          <div className="grid grid-cols-2 gap-3 mb-6 text-left mt-6">
            <div className="p-4 surface-card">
              <p className="text-xs text-content-muted mb-1">Target WPM</p>
              <p className="text-xl font-bold text-brand tabular-nums">{result.target_wpm}</p>
            </div>
            <div className="p-4 surface-card">
              <p className="text-xs text-content-muted mb-1">Quiz</p>
              <p className="text-xl font-bold text-content-primary tabular-nums">
                {result.questions_correct}/{result.questions_total}
              </p>
            </div>
            <div className="p-4 surface-card col-span-2">
              <p className="text-xs text-content-muted mb-1">Comprehension</p>
              <p className="text-xl font-bold text-content-primary tabular-nums">{result.comprehension_pct}%</p>
            </div>
          </div>

          {showCliffhanger ? (
            <CliffhangerGate
              track="adult"
              gate={continueGate}
              nextTitle={result.next_level_title ?? 'Speed Ridge'}
              onPrimary={() => {
                if (continueGate === 'signup') onSignup?.();
                else onSubscribe?.();
              }}
            />
          ) : (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {result.xp_awarded > 0 && (
                <span className="inline-flex items-center px-4 py-2 rounded-badge bg-brand/10 text-brand font-bold text-lg border border-brand/20">
                  +{result.xp_awarded} XP
                </span>
              )}
              {result.is_personal_best && (
                <CompletionBadge variant="completed" label="Personal Best" />
              )}
              {result.next_level_unlocked && hasNextLevel && (
                <CompletionBadge variant="unlocked" label="Next Level Unlocked" />
              )}
            </div>
          )}

          {!result.passed && !showCliffhanger && (
            <p className="text-sm text-content-secondary mb-6">
              Level complete, but mastery not reached.
            </p>
          )}

          <div className="space-y-3">
            {!result.passed && !showCliffhanger && (
              <>
                <button onClick={onRetry} className={primaryBtnClass}>
                  Retry Level
                </button>
                {onContinueAnyway && (
                  <button
                    onClick={() => void onContinueAnyway()}
                    className={secondaryBtnClass}
                  >
                    Continue Anyway
                  </button>
                )}
              </>
            )}

            {result.passed && hasNextLevel && continueGate === 'none' && renderNextLevelCta()}

            {showCliffhanger && (
              <button onClick={onRetry} className={secondaryBtnClass}>
                Try Again
              </button>
            )}

            <Link
              href="/train"
              className="block w-full px-6 py-3 text-content-muted hover:text-brand text-sm transition-colors text-center"
            >
              Back to Training Path
            </Link>
          </div>
        </AchievementCard>
      </div>
    </div>
  );
}
