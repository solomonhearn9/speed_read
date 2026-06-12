'use client';

import { useEffect, useRef, useState } from 'react';
import Modal, { type ModalTheme } from './Modal';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/lib/analytics';

type UpgradeReason =
  | 'pricing'
  | 'upload'
  | 'url'
  | 'word_limit'
  | 'session_limit'
  | 'challenge_limit'
  | 'training_limit'
  | 'level_locked'
  | 'advanced_training'
  | 'map_subscription_required';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: UpgradeReason;
  onRequireAuth?: () => void;
  theme?: ModalTheme;
}

const REASON_COPY: Record<UpgradeReason, { title: string; body: string }> = {
  pricing: {
    title: 'Upgrade for unlimited reading',
    body: 'Get unlimited words, file uploads, URL scraping, and sessions.',
  },
  upload: {
    title: 'Unlock file uploads',
    body: 'Upload PDF, DOCX, and TXT files with a Pro plan. Upgrade to get started.',
  },
  url: {
    title: 'Unlock URL scraping',
    body: 'Scrape articles from any URL with a Pro plan. Upgrade to get started.',
  },
  word_limit: {
    title: 'Upgrade for unlimited reading',
    body: 'You\'ve hit your word limit. Upgrade for unlimited reading on every session.',
  },
  session_limit: {
    title: 'Upgrade for unlimited sessions',
    body: 'You\'ve used all your sessions. Upgrade for unlimited reading anytime.',
  },
  challenge_limit: {
    title: 'Unlock unlimited challenges',
    body: 'You\'ve completed your 3 free 30-second challenges. Upgrade to keep playing and sharing your score.',
  },
  training_limit: {
    title: 'Unlock more training',
    body: 'Upgrade for unlimited daily training sessions and advanced levels.',
  },
  level_locked: {
    title: 'Unlock this level',
    body: 'This training level requires a Pro plan. Upgrade to continue your reading journey.',
  },
  advanced_training: {
    title: 'Unlock advanced training',
    body: 'Access higher-speed levels and endurance modes with a Pro plan.',
  },
  map_subscription_required: {
    title: 'Subscribe to start',
    body: 'The first level requires a Pro subscription. Upgrade to play and save your progress.',
  },
};

export default function UpgradeModal({
  isOpen,
  onClose,
  reason = 'pricing',
  onRequireAuth,
  theme = 'challenge',
}: UpgradeModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<'monthly' | 'lifetime' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const trackedOpenRef = useRef(false);

  const copy = REASON_COPY[reason];
  const learning = theme === 'learning';

  useEffect(() => {
    if (isOpen && !trackedOpenRef.current) {
      trackedOpenRef.current = true;
      trackEvent('upgrade_modal_viewed', { reason });
      trackEvent('pricing_page_viewed', { reason });
    }
    if (!isOpen) {
      trackedOpenRef.current = false;
    }
  }, [isOpen, reason]);

  const handleCheckout = async (priceType: 'monthly' | 'lifetime') => {
    if (!user) {
      onRequireAuth?.();
      return;
    }

    setLoading(priceType);
    setError(null);
    trackEvent(priceType === 'monthly' ? 'pricing_monthly_selected' : 'pricing_lifetime_selected', { reason });
    trackEvent('checkout_started', { checkout_type: priceType, priceType, reason });
    trackEvent(priceType === 'monthly' ? 'checkout_started_monthly' : 'checkout_started_lifetime', {
      checkout_type: priceType,
      priceType,
      reason,
    });

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType }),
      });

      const data = await res.json();

      if (res.status === 401) {
        onRequireAuth?.();
        return;
      }

      if (!res.ok || !data.url) {
        setError('Could not start checkout. Please try again.');
        return;
      }

      window.location.href = data.url;
    } catch {
      setError('Could not start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const planCard = (highlight?: boolean) =>
    learning
      ? `p-4 rounded-lg border ${highlight ? 'border-brand/30 bg-brand/5' : 'border-line bg-surface-secondary'}`
      : `p-4 rounded-lg ${highlight ? 'challenge-surface-solid border border-challenge-cta/30' : 'challenge-surface-solid border border-transparent'}`;

  const muted = learning ? 'text-content-muted' : 'challenge-text-muted';
  const priceMuted = learning ? 'text-content-muted' : 'text-slate-400';
  const titleColor = learning ? 'text-content-primary' : 'text-white';
  const ctaBtn = learning
    ? 'w-full px-4 py-2 btn-brand disabled:opacity-50 font-medium rounded-lg transition-colors text-sm'
    : 'w-full px-4 py-2 btn-challenge disabled:opacity-50 font-medium text-sm';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={copy.title} theme={theme}>
      <p className={`${muted} text-sm mb-6`}>{copy.body}</p>

      <div className="space-y-3 mb-4">
        <div className={planCard()}>
          <div className="flex justify-between items-center mb-2">
            <span className={`font-semibold ${titleColor}`}>Monthly</span>
            <span className={`text-lg font-bold ${titleColor}`}>
              $4.99<span className={`text-sm ${priceMuted}`}>/mo</span>
            </span>
          </div>
          <p className={`text-xs ${muted} mb-3`}>Unlimited reading, uploads, and URL scraping</p>
          <button
            onClick={() => handleCheckout('monthly')}
            disabled={loading !== null}
            className={ctaBtn}
          >
            {loading === 'monthly' ? 'Redirecting...' : 'Start Monthly'}
          </button>
        </div>

        <div className={planCard(true)}>
          <div className="flex justify-between items-center mb-2">
            <span className={`font-semibold ${titleColor}`}>Lifetime</span>
            <span className={`text-lg font-bold ${titleColor}`}>
              $29<span className={`text-sm ${priceMuted}`}> once</span>
            </span>
          </div>
          <p className={`text-xs ${muted} mb-3`}>Pay once, read forever — best value</p>
          <button
            onClick={() => handleCheckout('lifetime')}
            disabled={loading !== null}
            className={ctaBtn}
          >
            {loading === 'lifetime' ? 'Redirecting...' : 'Get Lifetime Access'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <button
        onClick={onClose}
        className={`w-full px-4 py-2 text-sm transition-colors ${
          learning ? 'text-content-muted hover:text-content-primary' : 'challenge-text-muted hover:text-white'
        }`}
      >
        Maybe later
      </button>
    </Modal>
  );
}
