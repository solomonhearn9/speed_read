'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/lib/analytics';

type AuthViewState =
  | 'form'
  | 'signup_success'
  | 'unverified_login'
  | 'verification_resent';

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
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setViewState('form');
      setError(null);
      setPassword('');
    }
  }, [isOpen, initialMode]);

  const handleResend = async () => {
    if (!email.trim()) return;
    setResendLoading(true);
    setError(null);
    const result = await resendVerificationEmail(email);
    setResendLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setViewState('verification_resent');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const result = await signIn(email, password);
      setLoading(false);

      if (result.error) {
        setError(result.error);
        if (result.status === 'unverified') {
          setViewState('unverified_login');
        }
        return;
      }

      onSuccess?.();
      onClose();
      return;
    }

    const result = await signUp(email, password);
    setLoading(false);

    if ('error' in result && result.error) {
      setError(result.error);
      return;
    }

    if ('status' in result && result.status === 'verification_required') {
      trackEvent('signup_completed');
      setViewState('signup_success');
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

  if (viewState === 'signup_success') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Check your email">
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Check your email to verify your account.
          </p>
          <p className="text-gray-400 text-sm">
            After verifying, return here and log in.
          </p>
          <p className="text-gray-500 text-xs">
            Sent to <span className="text-gray-300">{email}</span>
          </p>
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {resendLoading ? 'Sending...' : 'Resend verification email'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={switchToLogin}
            className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
          >
            Go to log in
          </button>
        </div>
      </Modal>
    );
  }

  if (viewState === 'verification_resent') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Email sent">
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Verification email resent to <span className="text-white">{email}</span>.
          </p>
          <p className="text-gray-400 text-sm">
            After verifying, return here and log in.
          </p>
          <button
            onClick={switchToLogin}
            className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
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
            disabled={resendLoading || !email.trim()}
            className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            {resendLoading ? 'Sending...' : 'Resend verification email'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={() => {
              setViewState('form');
              setError(null);
            }}
            className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Back to log in
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
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          minLength={6}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
        />

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
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
              className="text-red-400 hover:text-red-300"
            >
              Sign up free
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              onClick={switchToLogin}
              className="text-red-400 hover:text-red-300"
            >
              Log in
            </button>
          </>
        )}
      </p>
    </Modal>
  );
}
