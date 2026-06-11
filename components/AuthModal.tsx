'use client';

import { useState } from 'react';
import Modal from './Modal';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/lib/analytics';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onSuccess }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (mode === 'signup') {
      trackEvent('signup_completed');
    }

    onSuccess?.();
    onClose();
  };

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
            <button onClick={() => setMode('signup')} className="text-red-400 hover:text-red-300">
              Sign up free
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button onClick={() => setMode('login')} className="text-red-400 hover:text-red-300">
              Log in
            </button>
          </>
        )}
      </p>
    </Modal>
  );
}
