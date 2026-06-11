'use client';

import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/lib/analytics';

type UpgradeReason = 'pricing' | 'upload' | 'url' | 'word_limit' | 'session_limit' | 'challenge_limit';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: UpgradeReason;
  onRequireAuth?: () => void;
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
};

export default function UpgradeModal({
  isOpen,
  onClose,
  reason = 'pricing',
  onRequireAuth,
}: UpgradeModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<'monthly' | 'lifetime' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const trackedOpenRef = useRef(false);

  const copy = REASON_COPY[reason];

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
    trackEvent('checkout_started', { priceType, reason });
    trackEvent(priceType === 'monthly' ? 'checkout_started_monthly' : 'checkout_started_lifetime', { reason });

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={copy.title}>
      <p className="text-gray-400 text-sm mb-6">{copy.body}</p>

      <div className="space-y-3 mb-4">
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-white">Monthly</span>
            <span className="text-lg font-bold text-white">$4.99<span className="text-sm text-gray-400">/mo</span></span>
          </div>
          <p className="text-xs text-gray-400 mb-3">Unlimited reading, uploads, and URL scraping</p>
          <button
            onClick={() => handleCheckout('monthly')}
            disabled={loading !== null}
            className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            {loading === 'monthly' ? 'Redirecting...' : 'Start Monthly'}
          </button>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg border border-red-500/30">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-white">Lifetime</span>
            <span className="text-lg font-bold text-white">$29<span className="text-sm text-gray-400"> once</span></span>
          </div>
          <p className="text-xs text-gray-400 mb-3">Pay once, read forever — best value</p>
          <button
            onClick={() => handleCheckout('lifetime')}
            disabled={loading !== null}
            className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            {loading === 'lifetime' ? 'Redirecting...' : 'Get Lifetime Access'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <button
        onClick={onClose}
        className="w-full px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
      >
        Maybe later
      </button>
    </Modal>
  );
}
