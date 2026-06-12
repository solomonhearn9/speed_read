'use client';

import Link from 'next/link';
import type { ChapterWithStatus } from '@/lib/adventures/types';

interface AdventureChapterCardProps {
  storySlug: string;
  chapter: ChapterWithStatus;
}

export default function AdventureChapterCard({ storySlug, chapter }: AdventureChapterCardProps) {
  const isLocked = chapter.status === 'locked';
  const isCompleted = chapter.status === 'completed';

  const inner = (
    <div
      className={`adventure-card rounded-lg p-4 transition-all ${
        isLocked ? 'adventure-card-locked' : 'hover:border-emerald-400/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-cyan-400/80 mb-1">Chapter {chapter.chapter_number}</p>
          <h3 className="font-semibold text-white text-sm md:text-base">{chapter.title}</h3>
          {chapter.reward_name && (
            <p className="text-xs text-amber-400/80 mt-1">Reward: {chapter.reward_name}</p>
          )}
        </div>
        <span
          className={`text-xs px-2 py-1 rounded border ${
            isCompleted
              ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
              : isLocked
                ? 'border-gray-600 text-gray-500'
                : 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10'
          }`}
        >
          {isCompleted ? 'Done' : isLocked ? 'Locked' : 'Ready'}
        </span>
      </div>
      {!isLocked && <p className="mt-2 text-xs text-gray-500">Tap to read →</p>}
    </div>
  );

  if (isLocked) return inner;

  return (
    <Link href={`/adventures/${storySlug}/${chapter.slug}`}>
      {inner}
    </Link>
  );
}
