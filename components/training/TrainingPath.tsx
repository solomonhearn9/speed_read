'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { trackTrainingEvent } from '@/lib/training/analytics';
import type { TrainingPathResponse } from '@/lib/training/types';
import AuthModal from '@/components/AuthModal';
import UpgradeModal from '@/components/UpgradeModal';
import PuzzleRevealScreen from '@/components/puzzle/PuzzleRevealScreen';
import '@/components/puzzle/puzzle-theme.css';

export default function TrainingPath() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<TrainingPathResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/training/path');
        if (!res.ok) throw new Error('Failed to load training path');
        const json = await res.json();
        setData(json);
        trackTrainingEvent('training_path_viewed', profile, !!user, {
          tier_count: json.tiers?.length ?? 0,
        });
      } catch {
        setError('Could not load training path. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user, profile]);

  if (loading) {
    return (
      <div data-theme="challenge" className="puzzle-screen puzzle-theme-adult min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 challenge-glow pointer-events-none" aria-hidden="true" />
        <p className="relative challenge-text-muted text-sm">Loading your progress...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div data-theme="challenge" className="puzzle-screen puzzle-theme-adult min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <div className="absolute inset-0 challenge-glow pointer-events-none" aria-hidden="true" />
        <p className="relative text-red-400">{error ?? 'Something went wrong'}</p>
        <Link href="/" className="relative challenge-text-muted hover:text-white text-sm">
          ← Back home
        </Link>
      </div>
    );
  }

  const stats = [
    { id: 'xp', icon: '✦', value: data.profile.total_xp.toLocaleString(), label: 'Total XP' },
    { id: 'streak', icon: '🔥', value: String(data.profile.current_streak), label: 'Day streak' },
    { id: 'level', icon: '📖', value: `Lv ${data.profile.reader_level}`, label: 'Reader level' },
  ];

  return (
    <>
      <PuzzleRevealScreen
        track="adult"
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
