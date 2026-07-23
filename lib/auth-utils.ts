import type { AuthError, User } from '@supabase/supabase-js';

export const RATE_LIMIT_MESSAGE =
  "We've sent too many verification emails recently. Please wait a few minutes and try again.";

export const UNVERIFIED_LOGIN_MESSAGE =
  'Please verify your email before logging in.';

export const ACCOUNT_EXISTS_MESSAGE =
  'An account with this email already exists. Log in instead.';

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

export function isExistingAccountError(
  error: AuthError | { status?: number; message?: string; code?: string }
): boolean {
  const code = error.code?.toLowerCase() ?? '';
  if (code === 'user_already_exists' || code === 'email_exists') return true;
  const message = error.message?.toLowerCase() ?? '';
  return (
    message.includes('already registered') ||
    message.includes('already been registered') ||
    message.includes('user already exists') ||
    message.includes('email address is already')
  );
}

/** Supabase returns a user with empty identities when the email is already taken. */
export function isDuplicateSignupUser(user: User | null | undefined): boolean {
  return !!user && Array.isArray(user.identities) && user.identities.length === 0;
}

export function mapAuthError(error: AuthError | { status?: number; message?: string; code?: string }): {
  message: string;
  isRateLimited: boolean;
  isExistingUser: boolean;
} {
  const isRateLimited = isAuthRateLimitError(error);
  const isExistingUser = !isRateLimited && isExistingAccountError(error);
  return {
    message: isRateLimited
      ? RATE_LIMIT_MESSAGE
      : isExistingUser
        ? ACCOUNT_EXISTS_MESSAGE
        : (error.message ?? 'Something went wrong'),
    isRateLimited,
    isExistingUser,
  };
}
