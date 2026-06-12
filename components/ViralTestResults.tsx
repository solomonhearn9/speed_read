'use client';

import { useState } from 'react';
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
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 p-6">
        <div className="min-h-full flex items-center justify-center">
          <div className="w-full max-w-md text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">How far could you follow?</h2>

            <div className="space-y-3 text-gray-400 text-sm md:text-base mb-8">
              <p>This challenge increased from 300 → 900 WPM.</p>
              <p>Most readers comfortably follow between 400–600 WPM.</p>
            </div>

            <p className="text-white text-base md:text-lg mb-6">👇 Now try it with your own content.</p>

            <div className="space-y-3 mb-8">
              <button
                onClick={handlePasteText}
                className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
              >
                Paste Text
              </button>

              <button
                onClick={handleUploadPdf}
                className="w-full px-6 py-3 bg-gray-900 border border-gray-700 hover:border-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Upload PDF
              </button>
            </div>

            {!usage.isUnlimited && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-gray-800" />
                </div>

                <div className="p-5 bg-gray-900 rounded-lg border border-red-500/30 text-left">
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-3 text-center">Launch Offer</p>
                  <h3 className="text-lg font-semibold text-white text-center mb-1">Unlimited Reading</h3>
                  <p className="text-gray-400 text-sm text-center mb-4">Lifetime Access</p>
                  <p className="text-2xl font-bold text-white text-center mb-4">
                    $29 <span className="text-sm font-normal text-gray-400">one-time</span>
                  </p>
                  <button
                    onClick={handleUnlockLifetime}
                    disabled={checkoutLoading}
                    className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
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
      />
    </>
  );
}
