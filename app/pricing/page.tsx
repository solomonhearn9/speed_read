'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/lib/analytics';
import AuthModal from '@/components/AuthModal';
import MarketingPageShell from '@/components/marketing/MarketingPageShell';

export default function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<'monthly' | 'lifetime' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    trackEvent('pricing_page_viewed', { reason: 'pricing' });
  }, []);

  const handleCheckout = async (priceType: 'monthly' | 'lifetime') => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setLoading(priceType);
    setError(null);
    trackEvent(priceType === 'monthly' ? 'pricing_monthly_selected' : 'pricing_lifetime_selected', {
      reason: 'pricing',
    });
    trackEvent('checkout_started', { checkout_type: priceType, priceType, reason: 'pricing' });

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType }),
      });

      const data = await res.json();

      if (res.status === 401) {
        setShowAuthModal(true);
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
    <>
      <MarketingPageShell
        title="Pricing"
        subtitle="Upgrade for unlimited reading, uploads, URL scraping, and training."
      >
        <div className="space-y-4 max-w-lg mx-auto">
          <div className="challenge-surface rounded-xl p-5 md:p-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-white">Monthly</span>
              <span className="text-lg font-bold text-white">
                $4.99<span className="text-sm text-slate-400">/mo</span>
              </span>
            </div>
            <p className="text-xs challenge-text-muted mb-4">
              Unlimited reading, uploads, and URL scraping
            </p>
            <button
              onClick={() => handleCheckout('monthly')}
              disabled={loading !== null}
              className="w-full px-4 py-3 btn-challenge disabled:opacity-50 font-medium text-sm"
            >
              {loading === 'monthly' ? 'Redirecting...' : 'Start Monthly'}
            </button>
          </div>

          <div className="challenge-surface-solid rounded-xl p-5 md:p-6 border border-challenge-cta/30">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-white">Lifetime</span>
              <span className="text-lg font-bold text-white">
                $29<span className="text-sm text-slate-400"> once</span>
              </span>
            </div>
            <p className="text-xs challenge-text-muted mb-4">
              Pay once, read forever — best value
            </p>
            <button
              onClick={() => handleCheckout('lifetime')}
              disabled={loading !== null}
              className="w-full px-4 py-3 btn-challenge disabled:opacity-50 font-medium text-sm"
            >
              {loading === 'lifetime' ? 'Redirecting...' : 'Get Lifetime Access'}
            </button>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>

        <p className="mt-8 text-center text-sm challenge-text-muted">
          Not ready yet?{' '}
          <Link href="/" className="text-brand-cyan hover:text-white transition-colors">
            Start with the free challenge
          </Link>
        </p>
      </MarketingPageShell>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
        theme="challenge"
      />
    </>
  );
}
