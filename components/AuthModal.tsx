'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/lib/analytics';
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
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onSuccess }: AuthModalProps) {
  const { signIn, signUp, resendVerificationEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [viewState, setViewState] = useState<AuthViewState>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

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
      setError(result.error);
      return;
    }

    if ('status' in result && result.status === 'verification_required') {
      trackEvent('signup_completed');
      trackEvent('verification_email_sent');
      setViewState('verification_email_sent');
      return;
    }

    trackEvent('signup_completed');
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
      <Modal isOpen={isOpen} onClose={onClose} title="Check your email">
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Check your email to verify your account.
          </p>
          <p className="text-gray-300 text-sm">
            We sent a verification link to your inbox.
          </p>
          <p className="text-gray-500 text-xs">
            Sent to <span className="text-gray-300">{email}</span>
          </p>
          <p className="text-gray-400 text-sm">
            After verifying, return here and log in.
          </p>
          <button
            onClick={handleResend}
            disabled={isPending}
            className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Sending...' : 'Resend verification email'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={switchToLogin}
            disabled={isPending}
            className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            Go to log in
          </button>
        </div>
      </Modal>
    );
  }

  if (viewState === 'verification_resent') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Verification email resent">
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            We sent a verification link to your inbox.
          </p>
          <p className="text-gray-500 text-xs">
            Sent to <span className="text-gray-300">{email}</span>
          </p>
          <p className="text-gray-400 text-sm">
            After verifying, return here and log in.
          </p>
          <button
            onClick={handleResend}
            disabled={isPending}
            className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Sending...' : 'Resend again'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={switchToLogin}
            disabled={isPending}
            className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            Go to log in
          </button>
        </div>
      </Modal>
    );
  }

  if (viewState === 'unverified_login') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Email verification required">
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Please verify your email before logging in.
          </p>
          <p className="text-gray-400 text-sm">
            Check your inbox for the verification link, or resend it below.
          </p>
          {email && (
            <p className="text-gray-500 text-xs">
              Account: <span className="text-gray-300">{email}</span>
            </p>
          )}
          <button
            onClick={handleResend}
            disabled={isPending || !email.trim()}
            className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isPending ? 'Sending...' : 'Resend verification email'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={() => {
              setViewState('form');
              setError(null);
            }}
            disabled={isPending}
            className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            Back to log in
          </button>
        </div>
      </Modal>
    );
  }

  if (viewState === 'rate_limit') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Too many requests">
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">{RATE_LIMIT_MESSAGE}</p>
          <button
            onClick={() => {
              setViewState('form');
              setError(null);
            }}
            className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
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
    >
      <p className="text-gray-400 text-sm mb-4">
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
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 disabled:opacity-50"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          minLength={6}
          disabled={isPending}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 disabled:opacity-50"
        />

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {isPending ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-400">
        {mode === 'login' ? (
          <>
            No account?{' '}
            <button
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              disabled={isPending}
              className="text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              Sign up free
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              onClick={switchToLogin}
              disabled={isPending}
              className="text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              Log in
            </button>
          </>
        )}
      </p>
    </Modal>
  );
}
