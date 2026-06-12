'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { trackAdventureEvent } from '@/lib/adventures/analytics';
import { STORY_SLUG } from '@/lib/adventures/constants';
import type { AdventureStoryResponse } from '@/lib/adventures/types';
import { mapConfigs } from '@/lib/maps/mapConfigs';
import AuthModal from '@/components/AuthModal';
import UpgradeModal from '@/components/UpgradeModal';
import MapProgressScreen, {
  type MapNodeData,
  type MapStatToken,
} from '@/components/map/MapProgressScreen';

const config = mapConfigs.kids;

/**
 * Merge the kids map config (visual layout + fallback meta) with live chapter
 * data from /api/adventures/[storySlug]. Config node N maps to chapter N.
 */
function buildNodes(data: AdventureStoryResponse): MapNodeData[] {
  const chapters = data.chapters;
  const currentId = chapters.find((c) => c.status === 'unlocked')?.id ?? null;

  return config.levels.map((meta, i) => {
    const ch = chapters[i];
    if (!ch) {
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
      ch.status === 'unlocked'
        ? ch.id === currentId
          ? ('current' as const)
          : ('unlocked' as const)
        : ch.status;

    return {
      id: meta.id,
      levelNumber: ch.chapter_number,
      title: ch.title,
      description: meta.description,
      region: meta.region,
      targetWpm: ch.target_wpm,
      xpReward: ch.xp_reward + ch.completion_bonus_xp,
      status,
      href:
        ch.status === 'locked'
          ? null
          : `/adventures/${data.story.slug}/${ch.slug}`,
      stars: ch.status === 'completed' ? 3 : 0,
    };
  });
}

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

  const nodes = useMemo(() => (data ? buildNodes(data) : []), [data]);

  if (loading) {
    return (
      <div className="map-screen map-theme-kids min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading your adventure...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="map-screen map-theme-kids min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-400">Could not load adventures. Apply migration 005_adventures.sql.</p>
        <Link href="/" className="text-slate-400 hover:text-white text-sm">
          ← Back home
        </Link>
      </div>
    );
  }

  const chaptersDone = data.progress?.chapters_completed ?? 0;
  const stats: MapStatToken[] = [
    { id: 'xp', icon: '✦', value: data.profile.total_xp.toLocaleString(), label: 'Total XP' },
    {
      id: 'gems',
      icon: '💎',
      value: `${chaptersDone}/${data.story.total_chapters}`,
      label: 'Chapters completed',
    },
    { id: 'level', icon: '🐉', value: `Lv ${data.profile.reader_level}`, label: 'Reader level' },
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
                headline: 'Subscribe to start Chapter 1',
                detail: data.profile.is_logged_in
                  ? 'Upgrade to Pro to play the first chapter and save your adventure progress.'
                  : 'Sign in and subscribe to begin The Lost Crystal Dragon.',
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
