'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/lib/analytics';
import {
  getAccountPlanLabel,
  getCancelAtPeriodEndMessage,
  isPaidProfile,
} from '@/lib/plans';
import { canAccessBillingPortal } from '@/lib/stripe-profile-sync';
import AuthModal from './AuthModal';
import UpgradeModal from './UpgradeModal';

export default function AuthHeader() {
  const { user, profile, signOut } = useAuth();
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const isPaid = isPaidProfile(profile);
  const showManageBilling = canAccessBillingPortal(profile);
  const cancelMessage = getCancelAtPeriodEndMessage(profile);
  const planLabel = getAccountPlanLabel(profile);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/billing-portal', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      // Non-blocking
    } finally {
      setPortalLoading(false);
      setShowMenu(false);
    }
  };

  return (
    <>
      <header className="absolute top-0 right-0 left-0 z-10 flex items-center justify-end gap-3 p-4 md:p-6">
        {!isPaid && (
          <button
            onClick={() => setShowUpgrade(true)}
            className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
          >
            Upgrade
          </button>
        )}

        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-sm text-gray-300 hover:text-white bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 transition-colors max-w-[200px] truncate"
            >
              {user.email}
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-1 z-20">
                  <div className="px-4 py-2 border-b border-gray-800">
                    <p className="text-xs text-gray-500">Current plan</p>
                    <p className="text-sm text-white font-medium">{planLabel}</p>
                    {cancelMessage && (
                      <p className="text-xs text-amber-400/90 mt-1 leading-snug">{cancelMessage}</p>
                    )}
                  </div>

                  {showManageBilling && (
                    <button
                      onClick={handleManageBilling}
                      disabled={portalLoading}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50"
                    >
                      {portalLoading ? 'Opening...' : 'Manage Billing'}
                    </button>
                  )}

                  {!isPaid && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowUpgrade(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                    >
                      Upgrade
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      trackEvent('logout');
                      signOut();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <button
              onClick={() => {
                trackEvent('login_clicked');
                setAuthModal('login');
              }}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => {
                trackEvent('signup_clicked');
                setAuthModal('signup');
              }}
              className="text-sm bg-gray-900 border border-gray-700 hover:border-gray-600 text-white rounded-lg px-3 py-1.5 transition-colors"
            >
              Sign up
            </button>
          </>
        )}
      </header>

      <AuthModal
        isOpen={authModal !== null}
        onClose={() => setAuthModal(null)}
        initialMode={authModal ?? 'login'}
      />

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onRequireAuth={() => {
          setShowUpgrade(false);
          setAuthModal('login');
        }}
      />
    </>
  );
}
