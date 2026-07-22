'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useReadingStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/lib/analytics';
import {
  DEFAULT_CHALLENGE_CTA,
  getChallengeCtaForIntent,
  persistChallengeIntent,
  type ChallengeIntentId,
} from '@/lib/challengeIntent';
import {
  getViralTestRevealHeadline,
  getViralTestRetryWpm,
  getViralTestShareMessage,
} from '@/lib/viralTest';

const INTENT_OPTIONS: ReadonlyArray<{ id: ChallengeIntentId; label: string }> = [
  { id: 'saw_video', label: 'I saw the video' },
  { id: 'trouble_focusing', label: 'I have trouble focusing' },
  { id: 'read_more', label: 'I want to read more' },
  { id: 'for_kid', label: 'For my kid' },
  { id: 'student', label: "I'm a student" },
];

function buildShareUrl(wpm: number, compPct: number): string {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://speedread.cc';
  const params = new URLSearchParams({
    utm_source: 'share',
    utm_medium: 'social',
    challenge: String(wpm),
    comp: String(compPct),
  });
  return `${base}/?${params.toString()}`;
}

export default function ViralTestResults() {
  const viralTestResults = useReadingStore((state) => state.viralTestResults);
  const returnToLanding = useReadingStore((state) => state.returnToLanding);
  const retryViralTestAtReducedSpeed = useReadingStore((state) => state.retryViralTestAtReducedSpeed);
  const play = useReadingStore((state) => state.play);
  const { user } = useAuth();
  const [selectedIntent, setSelectedIntent] = useState<ChallengeIntentId | null>(null);
  const [showDefaultCta, setShowDefaultCta] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const scrollArmedRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Default CTA after ~4s or on scroll if user skips the router question
  useEffect(() => {
    if (!viralTestResults) return;
    const canShare =
      viralTestResults.revealTier === 'verified' || viralTestResults.revealTier === 'confirmed';
    if (!canShare || selectedIntent) return;

    const timer = window.setTimeout(() => setShowDefaultCta(true), 4000);

    const onScroll = () => {
      if (scrollArmedRef.current) return;
      scrollArmedRef.current = true;
      setShowDefaultCta(true);
    };

    const el = rootRef.current;
    el?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.clearTimeout(timer);
      el?.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll);
    };
  }, [viralTestResults, selectedIntent]);

  if (!viralTestResults) return null;

  const {
    wpm,
    percentile,
    comprehensionPct,
    comprehensionCorrect,
    comprehensionTotal,
    revealTier,
  } = viralTestResults;

  const headline = getViralTestRevealHeadline(wpm, revealTier);
  const canShare = revealTier === 'verified' || revealTier === 'confirmed';
  const retryWpm = getViralTestRetryWpm(wpm);

  const shareMessage = getViralTestShareMessage(wpm, percentile, {
    comprehensionPct,
    fullComprehension: revealTier === 'verified',
  });
  const shareUrl = buildShareUrl(wpm, comprehensionPct);

  const cta = selectedIntent
    ? getChallengeCtaForIntent(selectedIntent)
    : showDefaultCta
      ? DEFAULT_CHALLENGE_CTA
      : null;

  const handleIntent = (intent: ChallengeIntentId) => {
    if (selectedIntent) return;
    setSelectedIntent(intent);
    setShowDefaultCta(false);
    trackEvent('challenge_intent_selected', { intent });
    void persistChallengeIntent(intent, !!user);
  };

  const handleCtaClick = () => {
    if (!cta) return;
    trackEvent('challenge_intent_cta_clicked', {
      intent: selectedIntent ?? 'default',
      cta_label: cta.label,
      destination: cta.destination,
      href: cta.href,
    });
  };

  const handleShare = async () => {
    trackEvent('share_clicked', { wpm, comprehension_pct: comprehensionPct, source: 'challenge_results' });

    const payload = { title: 'Speed Reading Challenge', text: shareMessage, url: shareUrl };

    try {
      if (navigator.share) {
        await navigator.share(payload);
        trackEvent('viral_test_shared', { wpm, comprehension_pct: comprehensionPct, method: 'native' });
        return;
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
    }

    try {
      await navigator.clipboard.writeText(`${shareMessage}\n${shareUrl}`);
      trackEvent('copy_link_clicked', { wpm, comprehension_pct: comprehensionPct });
      trackEvent('viral_test_shared', { wpm, comprehension_pct: comprehensionPct, method: 'clipboard' });
      setShareFeedback('Link copied!');
      setTimeout(() => setShareFeedback(null), 2500);
    } catch {
      setShareFeedback('Could not share — try copying the link manually.');
    }
  };

  const handleRetry = () => {
    trackEvent('retry_level_clicked', {
      wpm,
      retry_wpm: retryWpm,
      comprehension_score: comprehensionCorrect,
      source: 'challenge_results',
    });
    retryViralTestAtReducedSpeed();
    setTimeout(() => play(), 100);
  };

  return (
    <div
      ref={rootRef}
      data-theme="challenge"
      className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-challenge-bg-start to-challenge-bg-end p-6"
    >
      <div className="absolute inset-0 challenge-glow pointer-events-none" aria-hidden="true" />
      <div className="relative min-h-full flex items-center justify-center py-8">
        <div className="w-full max-w-md text-center">
          {canShare ? (
            <>
              <p className="text-xs uppercase tracking-widest challenge-text-muted mb-3">
                {revealTier === 'verified' ? 'Verified result' : 'Your score'}
              </p>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight text-white leading-snug">
                {headline}
              </h2>
              <p className="challenge-text-muted text-sm mb-6">
                {comprehensionCorrect}/{comprehensionTotal} correct · faster than {percentile}% of
                readers
              </p>

              <div className="challenge-surface-solid border border-white/10 p-5 mb-6 text-left">
                <p className="text-xs uppercase tracking-widest challenge-text-muted mb-2">
                  Share card
                </p>
                <p className="text-white font-semibold text-lg mb-1">{shareMessage}</p>
                <p className="challenge-text-muted text-xs">Unlocked after comprehension check</p>
              </div>

              <button
                onClick={handleShare}
                className="w-full px-6 py-4 mb-6 btn-challenge text-base md:text-lg font-semibold"
              >
                {shareFeedback ?? 'Share your score'}
              </button>
              <p className="challenge-text-muted text-xs mb-8 -mt-4">
                Challenge a friend — can they beat {wpm} WPM?
              </p>

              <div className="mb-6 text-left">
                <p className="text-sm text-white font-medium mb-3 text-center">
                  What brought you here today?
                </p>
                <div className="space-y-2">
                  {INTENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleIntent(opt.id)}
                      className={`w-full px-4 py-2.5 challenge-btn-secondary text-sm text-left transition-colors ${
                        selectedIntent === opt.id
                          ? 'border-challenge-cta bg-challenge-cta/10 text-white'
                          : selectedIntent
                            ? 'opacity-50'
                            : ''
                      }`}
                      disabled={!!selectedIntent && selectedIntent !== opt.id}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {cta && (
                <Link
                  href={cta.href}
                  onClick={handleCtaClick}
                  className="block w-full px-6 py-4 btn-challenge text-base md:text-lg font-semibold"
                >
                  {cta.label}
                </Link>
              )}
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-widest challenge-text-muted mb-3">
                Find your actual edge
              </p>
              <h2 className="text-xl md:text-2xl font-extrabold mb-3 tracking-tight text-white leading-snug">
                {headline}
              </h2>
              <p className="challenge-text-muted text-sm mb-8">
                {comprehensionCorrect}/{comprehensionTotal} correct — dial it back and lock in what
                you can actually hold.
              </p>

              <button
                onClick={handleRetry}
                className="w-full px-6 py-4 mb-3 btn-challenge text-base md:text-lg font-semibold"
              >
                Retry at {retryWpm} WPM
              </button>
              <p className="challenge-text-muted text-xs mb-8">
                Same passage · 80% of the challenge pace · still timed
              </p>
              <p className="challenge-text-muted text-sm">
                Prefer a fresh start?{' '}
                <button
                  onClick={() => returnToLanding('text')}
                  className="text-challenge-cta hover:underline"
                >
                  Back to home
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
