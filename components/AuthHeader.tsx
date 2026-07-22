'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/lib/analytics';
import {
  getAccountPlanLabel,
  getCancelAtPeriodEndMessage,
  isPaidProfile,
} from '@/lib/plans';
import { canAccessBillingPortal } from '@/lib/stripe-profile-sync';
import type { ModalTheme } from './Modal';
import AuthModal from './AuthModal';
import UpgradeModal from './UpgradeModal';

interface AuthHeaderProps {
  theme?: ModalTheme;
}

const CHALLENGE_NAV = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
] as const;

export default function AuthHeader({ theme = 'challenge' }: AuthHeaderProps) {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const isPaid = isPaidProfile(profile);
  const showManageBilling = canAccessBillingPortal(profile);
  const cancelMessage = getCancelAtPeriodEndMessage(profile);
  const planLabel = getAccountPlanLabel(profile);
  const isChallenge = theme === 'challenge';

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

  const menuBtnClass = isChallenge
    ? 'text-sm text-slate-200 hover:text-white challenge-surface rounded-lg px-3 py-1.5 transition-colors max-w-[140px] sm:max-w-[200px] truncate'
    : 'text-sm text-content-secondary hover:text-content-primary surface-card rounded-lg px-3 py-1.5 transition-colors max-w-[140px] sm:max-w-[200px] truncate';

  const signupBtnClass = isChallenge
    ? 'text-xs sm:text-sm btn-challenge font-semibold px-3 sm:px-5 py-1.5 sm:py-2 whitespace-nowrap'
    : 'text-sm btn-brand rounded-lg px-3 py-1.5';

  const loginBtnClass = isChallenge
    ? 'text-xs sm:text-sm text-white hover:text-accent-red transition-colors whitespace-nowrap'
    : 'text-sm text-content-secondary hover:text-brand transition-colors';

  const navLinkClass = (href: string) => {
    const active = pathname === href;
    return `text-sm transition-colors ${
      active
        ? 'text-accent-red'
        : isChallenge
          ? 'text-white hover:text-accent-red'
          : 'text-content-secondary hover:text-brand'
    }`;
  };

  const closeMobileNav = () => setShowMobileNav(false);

  const mobileMenuButton = isChallenge ? (
    <button
      type="button"
      onClick={() => setShowMobileNav((open) => !open)}
      className="lg:hidden inline-flex items-center justify-center rounded-lg p-2 text-white hover:text-accent-red transition-colors shrink-0"
      aria-expanded={showMobileNav}
      aria-label={showMobileNav ? 'Close menu' : 'Open menu'}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        {showMobileNav ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        )}
      </svg>
    </button>
  ) : null;

  return (
    <>
      <header
        className={`sticky top-0 z-20 w-full ${
          isChallenge
            ? 'border-b border-white/5 bg-black'
            : 'border-b border-line bg-surface-primary/90 backdrop-blur-md'
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <Link href="/" className="shrink-0" onClick={closeMobileNav}>
            <Image
              src="/logo1.png"
              alt="SpeedRead"
              width={1809}
              height={452}
              className="h-8 w-auto sm:h-10 md:h-11 lg:h-12"
              priority
            />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 shrink-0">
            {isChallenge && (
              <nav className="hidden lg:flex items-center gap-5" aria-label="Main">
                {CHALLENGE_NAV.map((item) => (
                  <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}

            {user ? (
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className={menuBtnClass}
                >
                  {user.email}
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0" onClick={() => setShowMenu(false)} />
                    <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-elevated py-1 z-20 ${
                      isChallenge ? 'challenge-surface-solid' : 'surface-card'
                    }`}>
                      <div className={`px-4 py-2 border-b ${isChallenge ? 'border-white/10' : 'border-line'}`}>
                        <p className={`text-xs ${isChallenge ? 'challenge-text-muted' : 'text-content-muted'}`}>Current plan</p>
                        <p className={`text-sm font-medium ${isChallenge ? 'text-white' : 'text-content-primary'}`}>{planLabel}</p>
                        {cancelMessage && (
                          <p className="text-xs text-amber-400/90 mt-1 leading-snug">{cancelMessage}</p>
                        )}
                      </div>

                      {showManageBilling && (
                        <button
                          onClick={handleManageBilling}
                          disabled={portalLoading}
                          className={`w-full text-left px-4 py-2 text-sm disabled:opacity-50 ${
                            isChallenge
                              ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                              : 'text-content-secondary hover:bg-surface-secondary hover:text-content-primary'
                          }`}
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
                          className={`w-full text-left px-4 py-2 text-sm ${
                            isChallenge
                              ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                              : 'text-content-secondary hover:bg-surface-secondary hover:text-content-primary'
                          }`}
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
                        className={`w-full text-left px-4 py-2 text-sm ${
                          isChallenge
                            ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                            : 'text-content-secondary hover:bg-surface-secondary hover:text-content-primary'
                        }`}
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
                  className={`${loginBtnClass} hidden lg:inline-flex`}
                >
                  Log in
                </button>
                <button
                  onClick={() => {
                    trackEvent('signup_clicked');
                    setAuthModal('signup');
                  }}
                  className={signupBtnClass}
                >
                  Sign up
                </button>
              </>
            )}

            {mobileMenuButton}
          </div>
        </div>

        {isChallenge && showMobileNav && (
          <nav
            className="lg:hidden border-t border-white/10 px-4 py-3 sm:px-6 flex flex-col gap-1"
            aria-label="Main mobile"
          >
            {CHALLENGE_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${navLinkClass(item.href)} rounded-lg px-3 py-2.5`}
                onClick={closeMobileNav}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <AuthModal
        isOpen={authModal !== null}
        onClose={() => setAuthModal(null)}
        initialMode={authModal ?? 'login'}
        theme={theme}
      />

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        theme={theme}
        onRequireAuth={() => {
          setShowUpgrade(false);
          setAuthModal('login');
        }}
      />
    </>
  );
}
