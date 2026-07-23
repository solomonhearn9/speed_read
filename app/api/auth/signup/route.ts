import { ACCOUNT_EXISTS_MESSAGE, isExistingAccountError } from '@/lib/auth-utils';
import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Server-side signup via the service role so account creation does not depend on
 * Supabase's confirmation-email SMTP (which currently 500s on this project).
 * Users are created already confirmed; client then signs in with the password.
 */
export async function POST(request: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Auth is not configured', code: 'error' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Enter a valid email address.', code: 'error' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.', code: 'error' },
        { status: 400 }
      );
    }

    const service = createServiceClient();

    // Fast path: profile already exists for this email
    const { data: existingProfile } = await service
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: ACCOUNT_EXISTS_MESSAGE, code: 'existing_user' },
        { status: 409 }
      );
    }

    const { data, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      if (isExistingAccountError(error)) {
        return NextResponse.json(
          { error: ACCOUNT_EXISTS_MESSAGE, code: 'existing_user' },
          { status: 409 }
        );
      }
      console.error('[auth/signup] createUser failed:', error.message);
      return NextResponse.json(
        { error: error.message || 'Could not create account.', code: 'error' },
        { status: 500 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Could not create account.', code: 'error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[auth/signup] unexpected error:', err);
    return NextResponse.json(
      { error: 'Could not create account.', code: 'error' },
      { status: 500 }
    );
  }
}
