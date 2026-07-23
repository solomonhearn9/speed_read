'use client';

import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { PuzzlePathStats, PuzzlePublic, PuzzleTrack } from '@/lib/puzzles/types';
import { trackEvent } from '@/lib/analytics';

interface PuzzleCompletionOverlayProps {
  puzzle: PuzzlePublic;
  track: PuzzleTrack;
  trackStats: PuzzlePathStats;
  onDismiss: () => void;
  onStartNext?: (() => void) | null;
}

function buildShareMessage(
  title: string,
  track: PuzzleTrack,
  stats: PuzzlePathStats
): string {
  const trackLabel = track === 'kids' ? 'Kids Adventure' : 'Adult Training';
  const avg = stats.average_wpm != null ? `${Math.round(stats.average_wpm)} avg WPM` : 'reading streak';
  return `I completed "${title}" on SpeedRead (${trackLabel}) — ${stats.total_levels} levels, ${avg}, ${stats.current_streak}-day streak.`;
}

function buildShareUrl(track: PuzzleTrack): string {
  const params = new URLSearchParams({
    utm_source: 'share',
    utm_medium: 'puzzle_complete',
    utm_campaign: track,
  });
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/?${params.toString()}`;
}

function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${4 + ((i * 17) % 92)}%`,
        delay: `${(i % 10) * 0.05}s`,
        duration: `${2.2 + (i % 5) * 0.25}s`,
        color: ['#FF4438', '#FF7A70', '#EAB308', '#f472b6', '#C23028', '#F5F5F4'][i % 6],
      })),
    []
  );

  return (
    <div className="puzzle-confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            left: p.left,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

export default function PuzzleCompletionOverlay({
  puzzle,
  track,
  trackStats,
  onDismiss,
  onStartNext,
}: PuzzleCompletionOverlayProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const title = puzzle.title ?? 'Puzzle complete';
  const shareMessage = buildShareMessage(title, track, trackStats);
  const shareUrl = buildShareUrl(track);
  const completedOn = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleShare = async () => {
    trackEvent('share_clicked', {
      source: 'puzzle_complete',
      track,
      puzzle_id: puzzle.id,
    });

    const payload = {
      title: 'SpeedRead Puzzle Complete',
      text: shareMessage,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
    }

    try {
      await navigator.clipboard.writeText(`${shareMessage}\n${shareUrl}`);
      trackEvent('copy_link_clicked', { source: 'puzzle_complete', track });
      setShareFeedback('Link copied!');
      setTimeout(() => setShareFeedback(null), 2500);
    } catch {
      setShareFeedback('Could not share — try copying the link manually.');
    }
  };

  return (
    <div className="puzzle-reveal-overlay" role="dialog" aria-modal="true" aria-label="Puzzle complete">
      <ConfettiBurst />
      <div className="relative w-full max-w-md text-center py-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-3 puzzle-reveal-title">
          Puzzle complete
        </p>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 puzzle-reveal-title">
          {title}
        </h2>
        <p className="text-slate-300 text-sm mb-6 puzzle-reveal-title">
          {puzzle.reveal_message}
        </p>

        {puzzle.full_image_url ? (
          <div className="puzzle-reveal-image-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={puzzle.full_image_url}
              alt={title}
              className="w-full h-auto block"
            />
          </div>
        ) : null}

        <div
          ref={cardRef}
          className="puzzle-glass rounded-xl p-5 mb-6 text-left border border-white/10"
        >
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Share card</p>
          <p className="text-white font-semibold text-lg mb-2">{shareMessage}</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
            <p>
              Track:{' '}
              <span className="text-slate-200">
                {track === 'kids' ? 'Kids' : 'Adult'}
              </span>
            </p>
            <p>
              Completed: <span className="text-slate-200">{completedOn}</span>
            </p>
            <p>
              Levels:{' '}
              <span className="text-slate-200">{trackStats.total_levels}</span>
            </p>
            <p>
              Avg WPM:{' '}
              <span className="text-slate-200">
                {trackStats.average_wpm != null
                  ? Math.round(trackStats.average_wpm)
                  : '—'}
              </span>
            </p>
            <p>
              Streak:{' '}
              <span className="text-slate-200">{trackStats.current_streak} days</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handleShare}
            className="puzzle-cta"
          >
            {shareFeedback ?? 'Share'}
          </motion.button>

          {onStartNext ? (
            <button
              type="button"
              onClick={onStartNext}
              className="w-full px-6 py-3 rounded-xl border border-white/15 text-white text-sm font-semibold hover:bg-white/5"
            >
              Start the next puzzle
            </button>
          ) : (
            <p className="text-slate-400 text-sm py-2">
              You&apos;re all caught up — more coming soon
            </p>
          )}

          <button
            type="button"
            onClick={onDismiss}
            className="text-slate-500 text-sm hover:text-slate-300"
          >
            Back to puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
