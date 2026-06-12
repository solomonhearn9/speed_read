'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { trackAdventureEvent } from '@/lib/adventures/analytics';
import { STORY_SLUG } from '@/lib/adventures/constants';
import type { AdventuresListResponse } from '@/lib/adventures/types';
import './adventure-theme.css';

export default function AdventureHome() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<AdventuresListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/adventures');
        if (!res.ok) throw new Error('load failed');
        const json = await res.json();
        setData(json);
        trackAdventureEvent('adventures_home_viewed', profile, !!user);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user, profile]);

  const story = data?.stories?.[0];
  const progress = story?.progress;
  const chaptersDone = progress?.chapters_completed ?? 0;
  const totalChapters = story?.total_chapters ?? 5;
  const ctaLabel =
    chaptersDone === 0
      ? 'Start Chapter 1'
      : chaptersDone >= totalChapters
        ? 'Replay Story'
        : 'Continue Story';

  return (
    <div className="adventure-bg min-h-screen text-white p-6 md:p-8">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-cyan-300 mb-6 inline-block">
          ← Back
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Reading Adventures
        </h1>
        <p className="text-gray-400 text-sm md:text-base mb-8">
          Read short story quests and unlock the next chapter.
        </p>

        {loading && <p className="text-gray-500">Loading adventures...</p>}

        {story && (
          <div className="adventure-card adventure-portal-glow rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl" aria-hidden="true">🐉</span>
              <div>
                <h2 className="text-xl font-bold text-white">{story.title}</h2>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed">{story.description}</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Story progress</span>
                <span className="tabular-nums">
                  {user ? `${chaptersDone} / ${totalChapters} chapters` : 'Chapter 1 of 5'}
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                <div
                  className="h-full adventure-xp-bar transition-all"
                  style={{ width: `${(chaptersDone / totalChapters) * 100}%` }}
                />
              </div>
            </div>

            {!user && (
              <p className="text-xs text-amber-300/80 mb-4">
                Preview Chapter 1 free. Sign up to save XP and unlock Chapter 2.
              </p>
            )}

            <Link
              href={`/adventures/${story.slug || STORY_SLUG}`}
              className="block w-full text-center px-6 py-3 adventure-btn-primary text-white font-semibold rounded-lg transition-all"
            >
              {ctaLabel}
            </Link>
          </div>
        )}

        {!loading && !story && (
          <p className="text-red-400">Could not load adventures. Apply migration 005_adventures.sql.</p>
        )}
      </div>
    </div>
  );
}
