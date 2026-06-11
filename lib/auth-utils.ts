import type { AuthError, User } from '@supabase/supabase-js';

export const RATE_LIMIT_MESSAGE =
  "We've sent too many verification emails recently. Please wait a few minutes and try again.";

export const UNVERIFIED_LOGIN_MESSAGE =
  'Please verify your email before logging in.';

export function getAuthRedirectUrl(): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  return `${appUrl}/api/auth/callback`;
}

export function isEmailConfirmed(user: User): boolean {
  return !!(user.email_confirmed_at || user.confirmed_at);
}

export function isAuthRateLimitError(error: AuthError | { status?: number; message?: string }): boolean {
  if (error.status === 429) return true;
  const message = error.message?.toLowerCase() ?? '';
  return message.includes('rate limit') || message.includes('too many');
}

export function mapAuthError(error: AuthError | { status?: number; message?: string }): {
  message: string;
  isRateLimited: boolean;
} {
  const isRateLimited = isAuthRateLimitError(error);
  return {
    message: isRateLimited ? RATE_LIMIT_MESSAGE : (error.message ?? 'Something went wrong'),
    isRateLimited,
  };
}
