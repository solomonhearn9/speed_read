'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import {
  ACCOUNT_EXISTS_MESSAGE,
  getAuthRedirectUrl,
  isEmailConfirmed,
  mapAuthError,
  UNVERIFIED_LOGIN_MESSAGE,
} from '@/lib/auth-utils';
import type { Profile, UsageInfo } from '@/lib/types';
import { getUserTier, getUsageInfo } from '@/lib/plans';
import { getAnonSessionCount } from '@/lib/anonSessions';

export type SignUpResult =
  | { error: string; code: 'error' | 'rate_limited' | 'existing_user' }
  | { error: null; status: 'verification_required' }
  | { error: null; status: 'logged_in' };

export type SignInResult =
  | { error: string; status: 'error' | 'unverified' | 'rate_limited' }
  | { error: null; status: 'logged_in' };

export type ResendResult =
  | { error: null }
  | { error: string; code: 'error' | 'rate_limited' };

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  usage: UsageInfo;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<ResendResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionsUsed, setSessionsUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const tier = getUserTier(!!user, profile);
  const usage = getUsageInfo(tier, sessionsUsed);

  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  };

  const clearAuthState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setSessionsUsed(getAnonSessionCount());
  }, []);

  const establishSession = useCallback(async (sessionUser: User) => {
    setUser(sessionUser);
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .single();
    setProfile(data as Profile | null);
    try {
      const res = await fetch('/api/usage');
      if (res.ok) {
        const usageData = await res.json();
        setSessionsUsed(usageData.sessionsUsed ?? 0);
        if (usageData.profile) setProfile(usageData.profile);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  const validateAndApplySession = useCallback(
    async (sessionUser: User | undefined, session: { user: User } | null) => {
      const supabase = getSupabase();
      if (!sessionUser || !session) {
        clearAuthState();
        return;
      }

      if (!isEmailConfirmed(sessionUser)) {
        if (supabase) await supabase.auth.signOut();
        clearAuthState();
        return;
      }

      await establishSession(sessionUser);
    },
    [clearAuthState, establishSession]
  );

  const refreshUsage = useCallback(async () => {
    if (!user) {
      setSessionsUsed(getAnonSessionCount());
      return;
    }
    try {
      const res = await fetch('/api/usage');
      if (res.ok) {
        const data = await res.json();
        setSessionsUsed(data.sessionsUsed ?? 0);
        if (data.profile) setProfile(data.profile);
      }
    } catch {
      // Non-blocking
    }
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      clearAuthState();
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(data as Profile | null);
    await refreshUsage();
  }, [user, clearAuthState, refreshUsage]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setSessionsUsed(getAnonSessionCount());
      setIsLoading(false);
      return;
    }

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await validateAndApplySession(session?.user, session);
      if (!session?.user || !isEmailConfirmed(session.user)) {
        setSessionsUsed(getAnonSessionCount());
      }
      setIsLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await validateAndApplySession(session?.user, session);
      }
    );

    return () => subscription.unsubscribe();
  }, [validateAndApplySession]);

  const signUp = async (email: string, password: string): Promise<SignUpResult> => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Auth is not configured', code: 'error' };

    // Create via server (service role) so signup does not depend on confirmation SMTP.
    let createRes: Response;
    try {
      createRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      return { error: 'Could not create account. Please try again.', code: 'error' };
    }

    const createBody = (await createRes.json().catch(() => null)) as {
      error?: string;
      code?: string;
      ok?: boolean;
    } | null;

    if (!createRes.ok) {
      if (createBody?.code === 'existing_user' || createRes.status === 409) {
        return {
          error: createBody?.error || ACCOUNT_EXISTS_MESSAGE,
          code: 'existing_user',
        };
      }
      return {
        error: createBody?.error || 'Could not create account. Please try again.',
        code: 'error',
      };
    }

    // Account is confirmed server-side — sign in immediately.
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const mapped = mapAuthError(error);
      return {
        error: mapped.message,
        code: mapped.isRateLimited ? 'rate_limited' : 'error',
      };
    }

    if (data.user) {
      await establishSession(data.user);
      return { error: null, status: 'logged_in' };
    }

    return { error: 'Account created, but login failed. Try logging in.', code: 'error' };
  };

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Auth is not configured', status: 'error' };

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const mapped = mapAuthError(error);
      return {
        error: mapped.message,
        status: mapped.isRateLimited ? 'rate_limited' : 'error',
      };
    }

    if (data.user && !isEmailConfirmed(data.user)) {
      await supabase.auth.signOut();
      clearAuthState();
      return {
        error: UNVERIFIED_LOGIN_MESSAGE,
        status: 'unverified',
      };
    }

    if (data.user) {
      await establishSession(data.user);
      return { error: null, status: 'logged_in' };
    }

    return { error: 'Login failed. Please try again.', status: 'error' };
  };

  const resendVerificationEmail = async (email: string): Promise<ResendResult> => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Auth is not configured', code: 'error' };

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });

    if (error) {
      const mapped = mapAuthError(error);
      return {
        error: mapped.message,
        code: mapped.isRateLimited ? 'rate_limited' : 'error',
      };
    }

    return { error: null };
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    clearAuthState();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        usage,
        isLoading,
        refreshProfile,
        refreshUsage,
        signUp,
        signIn,
        signOut,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
