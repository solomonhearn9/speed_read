'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { trackTrainingEvent } from '@/lib/training/analytics';
import type { TrainingPathResponse, LevelWithProgress } from '@/lib/training/types';
import { mapConfigs } from '@/lib/maps/mapConfigs';
import AuthModal from '@/components/AuthModal';
import UpgradeModal from '@/components/UpgradeModal';
import MapProgressScreen, {
  type MapNodeData,
  type MapStatToken,
} from '@/components/map/MapProgressScreen';

const config = mapConfigs.adult;

/**
 * Merge the map config (visual layout + fallback meta) with live training
 * data from /api/training/path. Config node N maps to the Nth level in the
 * database; config nodes beyond the seeded levels render as "coming soon".
 */
function buildNodes(data: TrainingPathResponse): MapNodeData[] {
  const apiLevels: LevelWithProgress[] = data.tiers.flatMap((t) => t.levels);

  // The first unlocked-but-not-completed level is the player's current node.
  const currentId = apiLevels.find((l) => l.status === 'unlocked')?.id ?? null;

  return config.levels.map((meta, i) => {
    const api = apiLevels[i];
    if (!api) {
      return {
        id: meta.id,
        levelNumber: meta.levelNumber,
        title: meta.title,
        description: meta.description,
        region: meta.region,
        targetWpm: meta.targetWpm,
        xpReward: meta.xpReward,
        status: 'coming-soon' as const,
        href: null,
        stars: 0,
      };
    }

    const status =
      api.status === 'unlocked'
        ? api.id === currentId
          ? ('current' as const)
          : ('unlocked' as const)
        : api.status;

    const stars =
      api.status === 'mastered'
        ? 3
        : api.status === 'completed'
          ? Math.min(3, Math.max(1, api.best_quiz_score ?? 1))
          : 0;

    return {
      id: meta.id,
      levelNumber: api.level_number,
      title: api.title,
      description: meta.description,
      region: meta.region,
      targetWpm: api.target_wpm,
      xpReward: api.xp_pass,
      status,
      href:
        api.status === 'locked' || !api
          ? null
          : `/train/${api.id}`,
      stars,
      bestWpm: api.best_wpm,
    };
  });
}

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

  const nodes = useMemo(() => (data ? buildNodes(data) : []), [data]);

  if (loading) {
    return (
      <div className="map-screen map-theme-adult min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading the Reader&apos;s Journey...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="map-screen map-theme-adult min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-400">{error ?? 'Something went wrong'}</p>
        <Link href="/" className="text-slate-400 hover:text-white text-sm">
          ← Back home
        </Link>
      </div>
    );
  }

  const stats: MapStatToken[] = [
    { id: 'xp', icon: '✦', value: data.profile.total_xp.toLocaleString(), label: 'Total XP' },
    { id: 'streak', icon: '🔥', value: String(data.profile.current_streak), label: 'Day streak' },
    { id: 'level', icon: '📖', value: `Lv ${data.profile.reader_level}`, label: 'Reader level' },
  ];

  return (
    <>
      <MapProgressScreen
        config={config}
        nodes={nodes}
        stats={stats}
        backHref="/"
        guestBanner={
          data.profile.is_paid
            ? null
            : {
                headline: 'Subscribe to start Level 1',
                detail: data.profile.is_logged_in
                  ? 'Upgrade to Pro to play the first level and unlock your progress.'
                  : 'Sign in and subscribe to begin the Reader\'s Journey.',
              }
        }
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
