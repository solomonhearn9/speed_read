'use client';

import Link from 'next/link';
import type { LevelWithProgress } from '@/lib/training/types';
import CompletionBadge from './CompletionBadge';

interface TrainingLevelCardProps {
  level: LevelWithProgress;
  tierId: string;
}

function statusToVariant(status: LevelWithProgress['status']): 'mastered' | 'completed' | 'unlocked' | 'locked' {
  if (status === 'mastered') return 'mastered';
  if (status === 'completed') return 'completed';
  if (status === 'unlocked') return 'unlocked';
  return 'locked';
}

export default function TrainingLevelCard({ level, tierId }: TrainingLevelCardProps) {
  const isLocked = level.status === 'locked';
  const isMastered = level.status === 'mastered';
  const isUnlocked = level.status === 'unlocked';

  const content = (
    <div
      className={`p-5 rounded-xl border transition-all duration-200 ${
        isLocked
          ? 'border-line bg-surface-secondary/60 opacity-55'
          : isMastered
            ? 'surface-card border-success/40 bg-success-light/20'
            : isUnlocked
              ? 'surface-card-interactive border-brand/40 shadow-card-hover'
              : 'surface-card border-line hover:border-brand/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-left">
          <p className="text-xs text-content-muted mb-1 font-medium">Level {level.level_number}</p>
          <h3 className="font-bold text-content-primary text-sm md:text-base">{level.title}</h3>
          <p className="text-brand text-sm mt-1 tabular-nums font-semibold">{level.target_wpm} WPM</p>
        </div>
        <CompletionBadge variant={statusToVariant(level.status)} />
      </div>

      {level.recommend_retry && (
        <p className="mt-3 text-xs text-amber-700 bg-warning-light/50 rounded-md px-2 py-1 inline-block">
          Recommended: retry previous level
        </p>
      )}

      {level.best_comprehension_pct !== null && (
        <p className="mt-2 text-xs text-content-muted">
          Best: {level.best_comprehension_pct}% · {level.best_wpm ?? level.target_wpm} WPM
        </p>
      )}

      {!isLocked && (
        <p className="mt-3 text-xs text-brand font-medium">Tap to start →</p>
      )}
    </div>
  );

  if (isLocked) {
    return <div>{content}</div>;
  }

  return (
    <Link
      href={`/train/${level.id}`}
      data-tier-id={tierId}
    >
      {content}
    </Link>
  );
}
