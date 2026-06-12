'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { trackTrainingEvent } from '@/lib/training/analytics';
import { READER_LEVEL_XP_STEP } from '@/lib/training/xp';
import type { TrainingPathResponse } from '@/lib/training/types';
import TrainingLevelCard from './TrainingLevelCard';
import LevelBadge from './LevelBadge';
import StreakBadge from './StreakBadge';
import XPBar from './XPBar';

export default function TrainingPath() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<TrainingPathResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div data-theme="learning" className="min-h-screen bg-surface-primary flex items-center justify-center">
        <p className="text-content-muted">Loading training path...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div data-theme="learning" className="min-h-screen bg-surface-primary flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-500">{error ?? 'Something went wrong'}</p>
        <Link href="/" className="text-content-muted hover:text-brand text-sm">← Back home</Link>
      </div>
    );
  }

  const xpInCurrentLevel = data.profile.total_xp % READER_LEVEL_XP_STEP;

  return (
    <div data-theme="learning" className="min-h-screen bg-surface-primary text-content-primary">
      <div className="max-w-lg mx-auto px-6 py-8 md:py-12">
        <Link href="/" className="text-sm text-content-muted hover:text-brand mb-8 inline-block transition-colors">
          ← Back
        </Link>

        <header className="mb-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
            Become a better reader
          </h1>
          <p className="text-content-secondary text-sm md:text-base leading-relaxed">
            Short reading reps with quick comprehension checks. Build speed honestly.
          </p>
        </header>

        {data.profile.is_logged_in ? (
          <div className="mb-10 p-5 surface-card space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <LevelBadge level={data.profile.reader_level} />
              {data.profile.current_streak > 0 && (
                <StreakBadge days={data.profile.current_streak} />
              )}
            </div>
            <XPBar
              current={xpInCurrentLevel}
              max={READER_LEVEL_XP_STEP}
              label="Progress to next level"
            />
            <p className="text-xs text-content-muted tabular-nums">
              {data.profile.total_xp.toLocaleString()} total XP earned
            </p>
          </div>
        ) : (
          <div className="mb-10 p-4 surface-card border-warning/30 bg-warning-light/30 text-sm text-amber-800">
            Preview Level 1 free. Sign up to save XP and unlock all Bronze levels.
          </div>
        )}

        {data.tiers.map((tier, tierIndex) => (
          <section key={tier.id} className={tierIndex > 0 ? 'mt-section-lg' : ''}>
            <h2 className="text-lg font-bold tracking-tight mb-1">{tier.title}</h2>
            <p className="text-content-muted text-sm mb-5">{tier.description}</p>
            <div className="space-y-4">
              {tier.levels.map((level) => (
                <TrainingLevelCard key={level.id} level={level} tierId={tier.id} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
