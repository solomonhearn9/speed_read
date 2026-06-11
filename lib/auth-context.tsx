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
import { getAuthRedirectUrl, isEmailConfirmed } from '@/lib/auth-utils';
import type { Profile, UsageInfo } from '@/lib/types';
import { getUserTier, getUsageInfo } from '@/lib/plans';
import { getAnonSessionCount } from '@/lib/anonSessions';

export type SignUpResult =
  | { error: string }
  | { error: null; status: 'verification_required' }
  | { error: null; status: 'logged_in' };

export type SignInResult =
  | { error: string; status: 'error' | 'unverified' }
  | { error: null; status: 'logged_in' };

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
  resendVerificationEmail: (email: string) => Promise<{ error: string | null }>;
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
    if (!supabase) return { error: 'Auth is not configured' };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });

    if (error) return { error: error.message };

    if (!data.session) {
      await supabase.auth.signOut();
      clearAuthState();
      return { error: null, status: 'verification_required' };
    }

    if (data.user && !isEmailConfirmed(data.user)) {
      await supabase.auth.signOut();
      clearAuthState();
      return { error: null, status: 'verification_required' };
    }

    if (data.user) {
      await establishSession(data.user);
      return { error: null, status: 'logged_in' };
    }

    return { error: null, status: 'verification_required' };
  };

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Auth is not configured', status: 'error' };

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message, status: 'error' };
    }

    if (data.user && !isEmailConfirmed(data.user)) {
      await supabase.auth.signOut();
      clearAuthState();
      return {
        error: 'Please verify your email before logging in.',
        status: 'unverified',
      };
    }

    if (data.user) {
      await establishSession(data.user);
      return { error: null, status: 'logged_in' };
    }

    return { error: 'Login failed. Please try again.', status: 'error' };
  };

  const resendVerificationEmail = async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Auth is not configured' };

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });

    return { error: error?.message ?? null };
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
