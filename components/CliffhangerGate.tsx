'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

export type CliffhangerTrack = 'adult' | 'kids';
export type CliffhangerGateKind = 'signup' | 'subscription';

interface CliffhangerGateProps {
  track: CliffhangerTrack;
  gate: CliffhangerGateKind;
  nextTitle?: string | null;
  onPrimary: () => void;
  onSecondary?: () => void;
}

function copyFor(track: CliffhangerTrack, gate: CliffhangerGateKind, _nextTitle?: string | null) {
  if (gate === 'signup') {
    if (track === 'kids') {
      return {
        eyebrow: 'Cliffhanger',
        headline: 'What happens to the dragon? Chapter 2 is unlocked.',
        detail: 'Sign up free to continue the adventure — no payment required.',
        cta: 'Sign up free to continue',
      };
    }
    return {
      eyebrow: 'Cliffhanger',
      headline: 'Chapter 2 — Speed Ridge — is unlocked. Sign up free to continue.',
      detail: 'Create a free account to keep reading. No payment required at this step.',
      cta: 'Sign up free to continue',
    };
  }

  return {
    eyebrow: 'Continue the journey',
    headline: 'Subscribe to continue — from $4.99/mo',
    detail:
      track === 'kids'
        ? 'Unlock the rest of the adventure and keep collecting clues.'
        : 'Unlock advanced levels and unlimited reading on the Reader\'s Journey.',
    cta: 'Subscribe to continue',
  };
}

export default function CliffhangerGate({
  track,
  gate,
  nextTitle,
  onPrimary,
  onSecondary,
}: CliffhangerGateProps) {
  const copy = copyFor(track, gate, nextTitle);

  useEffect(() => {
    if (gate === 'signup') {
      trackEvent('signup_prompt_shown', { track, source: 'cliffhanger' });
    } else {
      trackEvent('subscription_prompt_shown', { track, source: 'cliffhanger' });
    }
  }, [gate, track]);

  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-5 mb-6 text-center">
      <p className="text-xs uppercase tracking-widest text-amber-300/90 mb-2">{copy.eyebrow}</p>
      <h3 className="text-lg md:text-xl font-bold text-white mb-2 leading-snug">{copy.headline}</h3>
      <p className="text-sm text-slate-300 mb-5">{copy.detail}</p>
      <button
        type="button"
        onClick={onPrimary}
        className="w-full px-6 py-3.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-base font-semibold transition-colors"
      >
        {copy.cta}
      </button>
      {onSecondary && (
        <button
          type="button"
          onClick={onSecondary}
          className="mt-3 text-sm text-slate-400 hover:text-white transition-colors"
        >
          Not now
        </button>
      )}
    </div>
  );
}
