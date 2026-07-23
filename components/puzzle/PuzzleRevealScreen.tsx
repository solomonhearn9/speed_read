'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { AccessTier } from '@/lib/accessTier';
import type {
  PuzzleCurrentLevel,
  PuzzlePathStats,
  PuzzlePublic,
  PuzzleSegmentState,
  PuzzleTrack,
} from '@/lib/puzzles/types';
import PuzzleBoard from './PuzzleBoard';
import PuzzleCompletionOverlay from './PuzzleCompletionOverlay';
import './puzzle-theme.css';

export interface PuzzleRevealScreenProps {
  track: PuzzleTrack;
  puzzle: PuzzlePublic | null;
  segments: PuzzleSegmentState[];
  currentLevel: PuzzleCurrentLevel | null;
  puzzleComplete: boolean;
  newlyRevealedSegment: number | null;
  trackStats: PuzzlePathStats;
  stats: Array<{ id: string; icon: string; value: string; label: string }>;
  backHref?: string;
  onGuestSignup?: () => void;
  onSubscriptionGate?: () => void;
  /** Called when user taps "Start the next puzzle" after completion. */
  onStartNextPuzzle?: (() => void) | null;
}

export default function PuzzleRevealScreen({
  track,
  puzzle,
  segments,
  currentLevel,
  puzzleComplete,
  newlyRevealedSegment,
  trackStats,
  stats,
  backHref = '/',
  onGuestSignup,
  onSubscriptionGate,
  onStartNextPuzzle,
}: PuzzleRevealScreenProps) {
  const [showCompletion, setShowCompletion] = useState(false);
  const [freshSegment, setFreshSegment] = useState<number | null>(null);

  const revealedCount = useMemo(
    () => segments.filter((s) => s.revealed).length,
    [segments]
  );

  // Image URL only after segment 1 is revealed — never leak silhouette/title early.
  const boardImageUrl =
    revealedCount > 0
      ? puzzle?.render_image_url ?? puzzle?.full_image_url ?? null
      : null;

  useEffect(() => {
    if (newlyRevealedSegment != null) {
      setFreshSegment(newlyRevealedSegment);
      const t = window.setTimeout(() => setFreshSegment(null), 1800);
      return () => window.clearTimeout(t);
    }
  }, [newlyRevealedSegment]);

  useEffect(() => {
    if (!puzzleComplete || !puzzle?.title) return;
    const key = `puzzle-complete-seen:${puzzle.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      setShowCompletion(true);
    } catch {
      setShowCompletion(true);
    }
  }, [puzzleComplete, puzzle?.id, puzzle?.title]);

  const handleCta = () => {
    if (!currentLevel) return;
    if (currentLevel.status === 'locked') {
      const tier = currentLevel.access_tier as AccessTier;
      if (tier === 'signup' && onGuestSignup) {
        onGuestSignup();
        return;
      }
      if (tier === 'subscription' && onSubscriptionGate) {
        onSubscriptionGate();
        return;
      }
    }
  };

  const ctaLabel = currentLevel
    ? track === 'kids'
      ? `Start Chapter ${currentLevel.level_number}`
      : `Start Level ${currentLevel.level_number}`
    : puzzleComplete
      ? null
      : 'Continue';

  const themeClass = track === 'kids' ? 'puzzle-theme-kids' : 'puzzle-theme-adult';

  return (
    <div data-theme="challenge" className={`puzzle-screen ${themeClass}`}>
      <div className="absolute inset-0 challenge-glow pointer-events-none" aria-hidden="true" />

      <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-4 md:pt-6">
        <header className="mb-6 flex items-center justify-between gap-3">
          <Link
            href={backHref}
            className="text-sm challenge-text-muted hover:text-white transition-colors"
          >
            ← Home
          </Link>
          <div className="flex flex-wrap justify-end gap-2">
            {stats.map((s) => (
              <div
                key={s.id}
                className="puzzle-glass rounded-full px-3 py-1.5 text-xs challenge-text-muted"
                title={s.label}
              >
                <span className="mr-1.5 opacity-70" aria-hidden>
                  {s.icon}
                </span>
                <span className="text-white/90">{s.value}</span>
              </div>
            ))}
          </div>
        </header>

        <div className="text-center mb-6 sm:mb-8">
          {/* Track title — puzzle mystery title stays hidden until full reveal */}
          <h1 className="puzzle-track-title">
            {track === 'kids' ? (
              <>
                Reading <span className="puzzle-track-title-accent">Adventures</span>
              </>
            ) : (
              <>
                Speed <span className="puzzle-track-title-accent">Training</span>
              </>
            )}
          </h1>
          <p className="puzzle-progress mt-3">
            {puzzleComplete && puzzle?.title
              ? puzzle.title
              : revealedCount === 0
                ? 'Finish a level to scratch off the next piece'
                : `${revealedCount} / ${puzzle?.segment_count ?? segments.length} uncovered`}
          </p>
        </div>

        {puzzle ? (
          <PuzzleBoard
            segmentCount={puzzle.segment_count}
            segments={segments}
            imageUrl={boardImageUrl}
            freshlyRevealedSegment={freshSegment}
            nextSegmentIndex={
              currentLevel &&
              currentLevel.status !== 'completed' &&
              currentLevel.status !== 'mastered'
                ? segments.find((s) => s.level_id === currentLevel.id)?.segment_index ??
                  currentLevel.level_number
                : null
            }
          />
        ) : (
          <div className="puzzle-board flex items-center justify-center challenge-text-muted text-sm">
            Puzzle content unavailable
          </div>
        )}

        <div className="mt-7 flex flex-col items-center gap-3">
          {currentLevel && ctaLabel ? (
            currentLevel.href && currentLevel.status !== 'locked' ? (
              <Link href={currentLevel.href} className="puzzle-cta">
                {ctaLabel}
              </Link>
            ) : (
              <button type="button" className="puzzle-cta" onClick={handleCta}>
                {ctaLabel}
              </button>
            )
          ) : null}

          {currentLevel && currentLevel.status !== 'locked' ? (
            <p className="challenge-text-muted text-sm text-center max-w-sm">
              {currentLevel.title}
              {currentLevel.target_wpm != null
                ? ` · ${currentLevel.target_wpm} WPM`
                : ''}
              {currentLevel.xp_reward != null ? ` · +${currentLevel.xp_reward} XP` : ''}
            </p>
          ) : null}

          {puzzleComplete && !currentLevel ? (
            <button
              type="button"
              className="puzzle-cta"
              onClick={() => setShowCompletion(true)}
            >
              View completed puzzle
            </button>
          ) : null}
        </div>
      </div>

      {showCompletion && puzzle?.title ? (
        <PuzzleCompletionOverlay
          puzzle={puzzle}
          track={track}
          trackStats={trackStats}
          onDismiss={() => setShowCompletion(false)}
          onStartNext={
            puzzle.next_puzzle_id && onStartNextPuzzle ? onStartNextPuzzle : null
          }
        />
      ) : null}
    </div>
  );
}
