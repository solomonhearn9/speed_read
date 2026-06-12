'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useReadingStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/lib/analytics';
import AuthModal from './AuthModal';

export default function ViralTestResults() {
  const viralTestResults = useReadingStore((state) => state.viralTestResults);
  const returnToLanding = useReadingStore((state) => state.returnToLanding);
  const { usage, user } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!viralTestResults) return null;

  const handlePasteText = () => {
    returnToLanding('text');
  };

  const handleUploadPdf = () => {
    returnToLanding('file');
  };

  const handleUnlockLifetime = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);
    trackEvent('pricing_lifetime_selected', { reason: 'challenge_complete' });
    trackEvent('checkout_started', { checkout_type: 'lifetime', priceType: 'lifetime', reason: 'challenge_complete' });
    trackEvent('checkout_started_lifetime', {
      checkout_type: 'lifetime',
      priceType: 'lifetime',
      reason: 'challenge_complete',
    });

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType: 'lifetime' }),
      });

      const data = await res.json();

      if (res.status === 401) {
        setShowAuthModal(true);
        return;
      }

      if (!res.ok || !data.url) {
        setCheckoutError('Could not start checkout. Please try again.');
        return;
      }

      window.location.href = data.url;
    } catch {
      setCheckoutError('Could not start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <>
      <div
        data-theme="challenge"
        className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-challenge-bg-start to-challenge-bg-end p-6"
      >
        <div className="absolute inset-0 challenge-glow pointer-events-none" aria-hidden="true" />
        <div className="relative min-h-full flex items-center justify-center">
          <div className="w-full max-w-md text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight text-white">
              How far could you follow?
            </h2>

            <div className="space-y-3 challenge-text-muted text-sm md:text-base mb-8">
              <p>This challenge increased from 300 → 900 WPM.</p>
              <p>Most readers comfortably follow between 400–600 WPM.</p>
            </div>

            <Link
              href="/train"
              onClick={() => trackEvent('training_path_viewed', { source: 'challenge_complete' })}
              className="block w-full px-6 py-4 mb-3 btn-challenge text-base md:text-lg"
            >
              Continue Learning
            </Link>
            <p className="challenge-text-muted text-xs mb-4">Short reading reps with comprehension checks</p>

            <Link
              href="/adventures"
              onClick={() => trackEvent('adventures_home_viewed', { source: 'challenge_complete' })}
              className="block w-full px-6 py-3 mb-6 challenge-btn-secondary text-base"
            >
              Try a Story Adventure
            </Link>

            <p className="text-white text-base md:text-lg mb-6">👇 Or try it with your own content.</p>

            <div className="space-y-3 mb-8">
              <button onClick={handlePasteText} className="w-full px-6 py-3 challenge-btn-secondary">
                Paste Text
              </button>

              <button onClick={handleUploadPdf} className="w-full px-6 py-3 challenge-btn-secondary">
                Upload PDF
              </button>
            </div>

            {!usage.isUnlimited && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="challenge-divider" />
                </div>

                <div className="p-5 challenge-surface-solid border border-challenge-cta/30 text-left">
                  <p className="text-xs uppercase tracking-widest challenge-text-muted mb-3 text-center">Launch Offer</p>
                  <h3 className="text-lg font-bold text-white text-center mb-1">Unlimited Reading</h3>
                  <p className="challenge-text-muted text-sm text-center mb-4">Lifetime Access</p>
                  <p className="text-2xl font-extrabold text-white text-center mb-4">
                    $29 <span className="text-sm font-normal challenge-text-muted">one-time</span>
                  </p>
                  <button
                    onClick={handleUnlockLifetime}
                    disabled={checkoutLoading}
                    className="w-full px-6 py-3 btn-challenge disabled:opacity-50 font-medium"
                  >
                    {checkoutLoading ? 'Redirecting...' : 'Unlock Lifetime'}
                  </button>
                  {checkoutError && (
                    <p className="mt-3 text-red-400 text-sm text-center">{checkoutError}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
        theme="challenge"
      />
    </>
  );
}
