'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { trackAdventureEvent } from '@/lib/adventures/analytics';
import type { AdventureStoryResponse } from '@/lib/adventures/types';
import AdventureChapterCard from './AdventureChapterCard';
import './adventure-theme.css';

interface AdventureStoryPageProps {
  storySlug: string;
}

export default function AdventureStoryPage({ storySlug }: AdventureStoryPageProps) {
  const { user, profile } = useAuth();
  const [data, setData] = useState<AdventureStoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/adventures/${storySlug}`);
        if (!res.ok) throw new Error('load failed');
        const json = await res.json();
        setData(json);
        trackAdventureEvent('adventure_story_viewed', profile, !!user, {
          story_id: json.story.id,
          story_slug: storySlug,
        });
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [storySlug, user, profile]);

  if (loading) {
    return (
      <div className="adventure-bg min-h-screen flex items-center justify-center text-gray-400">
        Loading story...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="adventure-bg min-h-screen flex flex-col items-center justify-center gap-4 text-red-400 p-6">
        <p>Story not found.</p>
        <Link href="/adventures" className="text-gray-400 text-sm">← Adventures</Link>
      </div>
    );
  }

  const { story, chapters, progress, profile: prof } = data;
  const nextChapter = chapters.find((c) => c.status === 'unlocked');

  return (
    <div className="adventure-bg min-h-screen text-white p-6 md:p-8">
      <div className="max-w-lg mx-auto">
        <Link href="/adventures" className="text-sm text-gray-400 hover:text-cyan-300 mb-6 inline-block">
          ← Adventures
        </Link>

        <h1 className="text-2xl font-bold mb-1">{story.title}</h1>
        <p className="text-gray-400 text-sm mb-6">{story.description}</p>

        {prof.is_logged_in && (
          <div className="flex gap-4 mb-6 p-3 adventure-card rounded-lg text-sm">
            <div>
              <p className="text-xs text-gray-500">Level</p>
              <p className="font-bold text-emerald-400">{prof.reader_level}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">XP</p>
              <p className="font-bold text-amber-400 tabular-nums">{prof.total_xp}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Chapters</p>
              <p className="font-bold tabular-nums">
                {progress?.chapters_completed ?? 0}/{story.total_chapters}
              </p>
            </div>
          </div>
        )}

        {nextChapter && (
          <Link
            href={`/adventures/${storySlug}/${nextChapter.slug}`}
            className="block w-full text-center mb-8 px-6 py-3 adventure-btn-primary text-white font-semibold rounded-lg"
          >
            {progress?.chapters_completed ? 'Continue Story' : 'Start Chapter 1'}
          </Link>
        )}

        <h2 className="text-sm uppercase tracking-widest text-gray-500 mb-3">Chapters</h2>
        <div className="space-y-3">
          {chapters.map((ch) => (
            <AdventureChapterCard key={ch.id} storySlug={storySlug} chapter={ch} />
          ))}
        </div>
      </div>
    </div>
  );
}
