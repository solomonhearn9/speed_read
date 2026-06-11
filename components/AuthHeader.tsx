'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/lib/analytics';
import AuthModal from './AuthModal';
import UpgradeModal from './UpgradeModal';

export default function AuthHeader() {
  const { user, signOut } = useAuth();
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <header className="absolute top-0 right-0 left-0 z-10 flex items-center justify-end gap-3 p-4 md:p-6">
        <button
          onClick={() => {
            trackEvent('upgrade_modal_viewed');
            setShowUpgrade(true);
          }}
          className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
        >
          Upgrade
        </button>

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
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-1 z-20">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      trackEvent('upgrade_modal_viewed');
                      setShowUpgrade(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    Upgrade plan
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
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
