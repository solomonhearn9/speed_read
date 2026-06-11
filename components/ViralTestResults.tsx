'use client';

import { useState } from 'react';
import { useReadingStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/lib/analytics';
import { getViralTestShareMessage } from '@/lib/viralTest';
import { canStartViralTest, getViralTestAttemptsRemaining, incrementViralTestAttemptCount } from '@/lib/viralTestAttempts';
import AuthModal from './AuthModal';
import UpgradeModal from './UpgradeModal';

export default function ViralTestResults() {
  const { viralTestResults, reset, startViralTest, play } = useReadingStore();
  const { usage } = useAuth();
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied'>('idle');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!viralTestResults) return null;

  const { wpm, percentile, wordsRead, durationSec } = viralTestResults;
  const shareMessage = getViralTestShareMessage(wpm, percentile);
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const attemptsRemaining = getViralTestAttemptsRemaining(usage.isUnlimited);

  const handleShare = async () => {
    trackEvent('viral_test_shared', { wpm, percentile });

    const payload = { title: 'Speed Reader Challenge', text: shareMessage, url: shareUrl };

    if (navigator.share) {
      try {
        await navigator.share(payload);
        setShareStatus('shared');
        return;
      } catch {
        // Fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareMessage} ${shareUrl}`);
      setShareStatus('copied');
    } catch {
      setShareStatus('idle');
    }
  };

  const handleTryAgain = () => {
    if (!canStartViralTest(usage.isUnlimited)) {
      trackEvent('challenge_limit_hit');
      setShowUpgradeModal(true);
      return;
    }

    incrementViralTestAttemptCount();
    trackEvent('viral_test_started');
    startViralTest();
    setShareStatus('idle');
    setTimeout(() => play(), 100);
  };

  const handlePasteOwnText = () => {
    reset();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6">
        <div className="w-full max-w-md text-center">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Challenge complete</p>

          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="text-red-500">{wpm}</span> WPM
          </h2>

          <p className="text-gray-400 text-sm md:text-base mb-8">
            {wpm} WPM faster than <span className="text-white font-medium">{percentile}%</span> of readers
            <span className="text-gray-600"> · {wordsRead} words in {durationSec}s</span>
          </p>

          <div className="space-y-3">
            <button
              onClick={handleShare}
              className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
            >
              {shareStatus === 'copied'
                ? 'Link copied!'
                : shareStatus === 'shared'
                  ? 'Shared!'
                  : 'Share your score'}
            </button>

            <button
              onClick={handleTryAgain}
              className="w-full px-6 py-3 bg-gray-900 border border-gray-700 hover:border-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Try again
            </button>
            {attemptsRemaining !== null && attemptsRemaining > 0 && (
              <p className="text-xs text-gray-500">
                {attemptsRemaining} free {attemptsRemaining === 1 ? 'challenge' : 'challenges'} left
              </p>
            )}

            <button
              onClick={handlePasteOwnText}
              className="w-full px-6 py-3 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Paste your own text
            </button>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="challenge_limit"
        onRequireAuth={() => {
          setShowUpgradeModal(false);
          setShowAuthModal(true);
        }}
      />
    </>
  );
}
