import type { User } from '@supabase/supabase-js';

export function getAuthRedirectUrl(): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  return `${appUrl}/api/auth/callback`;
}

export function isEmailConfirmed(user: User): boolean {
  return !!(user.email_confirmed_at || user.confirmed_at);
}
