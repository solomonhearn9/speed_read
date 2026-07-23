'use client';

import { useEffect, useState } from 'react';
import Modal, { type ModalTheme } from './Modal';
import { useAuth } from '@/lib/auth-context';
import { trackEvent, persistSignupAttribution } from '@/lib/analytics';
import { RATE_LIMIT_MESSAGE } from '@/lib/auth-utils';

type AuthViewState =
  | 'form'
  | 'verification_email_sent'
  | 'verification_resent'
  | 'unverified_login'
  | 'rate_limit';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccess?: () => void;
  theme?: ModalTheme;
}

function authStyles(theme: ModalTheme) {
  const learning = theme === 'learning';
  return {
    modalTheme: theme,
    body: learning ? 'text-content-secondary text-sm' : 'text-slate-300 text-sm',
    sub: learning ? 'text-content-muted text-xs' : 'text-slate-500 text-xs',
    hint: learning ? 'text-content-muted text-sm' : 'challenge-text-muted text-sm',
    intro: learning ? 'text-content-muted text-sm mb-4' : 'challenge-text-muted text-sm mb-4',
    input: learning
      ? 'w-full bg-surface-secondary border border-line rounded-lg p-3 text-content-primary placeholder:text-content-disabled focus:outline-none focus:border-brand disabled:opacity-50'
      : 'challenge-input disabled:opacity-50',
    primary: learning
      ? 'w-full px-6 py-3 btn-brand rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium'
      : 'w-full px-6 py-3 btn-challenge disabled:opacity-50 disabled:cursor-not-allowed font-medium',
    secondary: learning
      ? 'w-full px-4 py-2 text-sm text-content-secondary hover:text-content-primary border border-line hover:border-brand/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
      : 'w-full px-4 py-2 text-sm challenge-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed',
    ghost: learning
      ? 'w-full px-4 py-2 text-sm text-content-muted hover:text-content-primary disabled:opacity-50 transition-colors'
      : 'w-full px-4 py-2 text-sm challenge-text-muted hover:text-white disabled:opacity-50 transition-colors',
    link: learning
      ? 'text-brand hover:text-brand-hover disabled:opacity-50'
      : 'text-accent-red hover:text-white disabled:opacity-50',
    footer: learning ? 'text-content-muted' : 'challenge-text-muted',
  };
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
  theme = 'challenge',
}: AuthModalProps) {
  const { signIn, signUp, resendVerificationEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [viewState, setViewState] = useState<AuthViewState>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const s = authStyles(theme);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setViewState('form');
      setError(null);
      setPassword('');
      setIsPending(false);
    }
  }, [isOpen, initialMode]);

  const handleResend = async () => {
    if (!email.trim() || isPending) return;
    setIsPending(true);
    setError(null);

    const result = await resendVerificationEmail(email);

    setIsPending(false);

    if (result.error) {
      if (result.code === 'rate_limited') {
        setViewState('rate_limit');
        return;
      }
      setError(result.error);
      return;
    }

    trackEvent('verification_email_resent');
    setViewState('verification_resent');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    setError(null);
    setIsPending(true);

    if (mode === 'login') {
      const result = await signIn(email, password);
      setIsPending(false);

      if (result.error) {
        if (result.status === 'rate_limited') {
          setViewState('rate_limit');
          return;
        }
        if (result.status === 'unverified') {
          setViewState('unverified_login');
          return;
        }
        trackEvent('login_failed', { reason: result.status });
        setError(result.error);
        return;
      }

      trackEvent('login_success');
      onSuccess?.();
      onClose();
      return;
    }

    const result = await signUp(email, password);
    setIsPending(false);

    if ('error' in result && result.error) {
      if (result.code === 'rate_limited') {
        setViewState('rate_limit');
        return;
      }
      if (result.code === 'existing_user') {
        setMode('login');
        setViewState('form');
        setError(result.error);
        return;
      }
      setError(result.error);
      return;
    }

    if ('status' in result && result.status === 'verification_required') {
      trackEvent('signup_completed');
      trackEvent('verification_email_sent');
      void persistSignupAttribution();
      setViewState('verification_email_sent');
      return;
    }

    trackEvent('signup_completed');
    void persistSignupAttribution();
    onSuccess?.();
    onClose();
  };

  const switchToLogin = () => {
    setMode('login');
    setViewState('form');
    setError(null);
  };

  if (viewState === 'verification_email_sent') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Check your email" theme={s.modalTheme}>
        <div className="space-y-4">
          <p className={s.body}>Check your email to verify your account.</p>
          <p className={s.body}>We sent a verification link to your inbox.</p>
          <p className={s.sub}>
            Sent to <span className={theme === 'learning' ? 'text-content-primary' : 'text-slate-200'}>{email}</span>
          </p>
          <p className={s.hint}>After verifying, return here and log in.</p>
          <button onClick={handleResend} disabled={isPending} className={s.secondary}>
            {isPending ? 'Sending...' : 'Resend verification email'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={switchToLogin} disabled={isPending} className={s.primary}>
            Go to log in
          </button>
        </div>
      </Modal>
    );
  }

  if (viewState === 'verification_resent') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Verification email resent" theme={s.modalTheme}>
        <div className="space-y-4">
          <p className={s.body}>We sent a verification link to your inbox.</p>
          <p className={s.sub}>
            Sent to <span className={theme === 'learning' ? 'text-content-primary' : 'text-slate-200'}>{email}</span>
          </p>
          <p className={s.hint}>After verifying, return here and log in.</p>
          <button onClick={handleResend} disabled={isPending} className={s.secondary}>
            {isPending ? 'Sending...' : 'Resend again'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={switchToLogin} disabled={isPending} className={s.primary}>
            Go to log in
          </button>
        </div>
      </Modal>
    );
  }

  if (viewState === 'unverified_login') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Email verification required" theme={s.modalTheme}>
        <div className="space-y-4">
          <p className={s.body}>Please verify your email before logging in.</p>
          <p className={s.hint}>Check your inbox for the verification link, or resend it below.</p>
          {email && (
            <p className={s.sub}>
              Account: <span className={theme === 'learning' ? 'text-content-primary' : 'text-slate-200'}>{email}</span>
            </p>
          )}
          <button
            onClick={handleResend}
            disabled={isPending || !email.trim()}
            className={s.primary}
          >
            {isPending ? 'Sending...' : 'Resend verification email'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={() => { setViewState('form'); setError(null); }} disabled={isPending} className={s.ghost}>
            Back to log in
          </button>
        </div>
      </Modal>
    );
  }

  if (viewState === 'rate_limit') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Too many requests" theme={s.modalTheme}>
        <div className="space-y-4">
          <p className={s.body}>{RATE_LIMIT_MESSAGE}</p>
          <button
            onClick={() => { setViewState('form'); setError(null); }}
            className={s.primary}
          >
            Back
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? 'Log in' : 'Sign up free'}
      theme={s.modalTheme}
    >
      <p className={s.intro}>
        {mode === 'login'
          ? 'Welcome back! Log in to sync your reading progress.'
          : 'Sign up free to unlock 1,500 words/session and 5 daily sessions.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          disabled={isPending}
          className={s.input}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          minLength={6}
          disabled={isPending}
          className={s.input}
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button type="submit" disabled={isPending} className={s.primary}>
          {isPending ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>

      <p className={`mt-4 text-center text-sm ${s.footer}`}>
        {mode === 'login' ? (
          <>
            No account?{' '}
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              disabled={isPending}
              className={s.link}
            >
              Sign up free
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button onClick={switchToLogin} disabled={isPending} className={s.link}>
              Log in
            </button>
          </>
        )}
      </p>
    </Modal>
  );
}
