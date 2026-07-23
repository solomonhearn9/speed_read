'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { trackAdventureEvent } from '@/lib/adventures/analytics';
import { STORY_SLUG } from '@/lib/adventures/constants';
import type { AdventureStoryResponse } from '@/lib/adventures/types';
import AuthModal from '@/components/AuthModal';
import UpgradeModal from '@/components/UpgradeModal';
import PuzzleRevealScreen from '@/components/puzzle/PuzzleRevealScreen';
import '@/components/puzzle/puzzle-theme.css';

export default function AdventureHome() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<AdventureStoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/adventures/${STORY_SLUG}`);
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

  if (loading) {
    return (
      <div data-theme="challenge" className="puzzle-screen puzzle-theme-kids min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 challenge-glow pointer-events-none" aria-hidden="true" />
        <p className="relative challenge-text-muted text-sm">Loading your adventure...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div data-theme="challenge" className="puzzle-screen puzzle-theme-kids min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <div className="absolute inset-0 challenge-glow pointer-events-none" aria-hidden="true" />
        <p className="relative text-red-400">
          Could not load adventures. Apply migration 007_puzzles_and_scoring.sql.
        </p>
        <Link href="/" className="relative challenge-text-muted hover:text-white text-sm">
          ← Back home
        </Link>
      </div>
    );
  }

  const chaptersDone = data.progress?.chapters_completed ?? 0;
  const stats = [
    { id: 'xp', icon: '✦', value: data.profile.total_xp.toLocaleString(), label: 'Total XP' },
    {
      id: 'gems',
      icon: '◆',
      value: `${chaptersDone}/${data.story.total_chapters}`,
      label: 'Chapters completed',
    },
    { id: 'level', icon: '★', value: `Lv ${data.profile.reader_level}`, label: 'Reader level' },
  ];

  return (
    <>
      <PuzzleRevealScreen
        track="kids"
        puzzle={data.puzzle}
        segments={data.segments}
        currentLevel={data.current_level}
        puzzleComplete={data.puzzle_complete}
        newlyRevealedSegment={data.newly_revealed_segment}
        trackStats={data.track_stats}
        stats={stats}
        backHref="/"
        onGuestSignup={
          data.profile.is_logged_in ? undefined : () => setShowAuthModal(true)
        }
        onSubscriptionGate={() => {
          if (!data.profile.is_logged_in) {
            setShowAuthModal(true);
            return;
          }
          setShowUpgradeModal(true);
        }}
        onStartNextPuzzle={null}
      />
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="map_subscription_required"
        onRequireAuth={() => {
          setShowUpgradeModal(false);
          setShowAuthModal(true);
        }}
        theme="challenge"
      />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
        theme="challenge"
      />
    </>
  );
}
