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
import type { Profile, UsageInfo } from '@/lib/types';
import { getUserTier, getUsageInfo } from '@/lib/plans';
import { getAnonSessionCount } from '@/lib/anonSessions';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  usage: UsageInfo;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
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

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data as Profile | null);
    return data as Profile | null;
  }, []);

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
      setProfile(null);
      setSessionsUsed(getAnonSessionCount());
      return;
    }
    await fetchProfile(user.id);
    await refreshUsage();
  }, [user, fetchProfile, refreshUsage]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setSessionsUsed(getAnonSessionCount());
      setIsLoading(false);
      return;
    }

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
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
      } else {
        setSessionsUsed(getAnonSessionCount());
      }
      setIsLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
        await refreshUsage();
      } else {
        setProfile(null);
        setSessionsUsed(getAnonSessionCount());
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, refreshUsage]);

  const signUp = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Auth is not configured' };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Auth is not configured' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setProfile(null);
    setSessionsUsed(getAnonSessionCount());
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
