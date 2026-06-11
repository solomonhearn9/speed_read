import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

const OTP_TYPES = new Set<string>(['signup', 'email', 'recovery', 'email_change', 'invite']);

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/';

  const successUrl = new URL(next, requestUrl.origin);
  successUrl.searchParams.set('auth', 'verified');

  const failureUrl = new URL('/', requestUrl.origin);
  failureUrl.searchParams.set('auth', 'verification_failed');

  // Response is created first so session cookies can be written onto it during auth.
  let response = NextResponse.redirect(successUrl);
  const supabase = createRouteHandlerClient(request, response);

  try {
    if (token_hash && type && OTP_TYPES.has(type)) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as EmailOtpType,
      });

      if (error) {
        console.error('Auth callback verifyOtp error:', error.message);
        return NextResponse.redirect(failureUrl);
      }

      return response;
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Auth callback exchangeCodeForSession error:', error.message);
        return NextResponse.redirect(failureUrl);
      }

      return response;
    }

    console.error('Auth callback: no code or token_hash present');
    return NextResponse.redirect(failureUrl);
  } catch (err) {
    console.error('Auth callback unexpected error:', err);
    return NextResponse.redirect(failureUrl);
  }
}
