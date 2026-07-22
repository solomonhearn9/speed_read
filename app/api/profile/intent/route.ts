import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isChallengeIntentId } from '@/lib/challengeIntent';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { challenge_intent?: string };
    const intent = body.challenge_intent;
    if (!intent || !isChallengeIntentId(intent)) {
      return NextResponse.json({ error: 'invalid_intent' }, { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'auth_required' }, { status: 401 });
    }

    const service = createServiceClient();
    const { error } = await service
      .from('profiles')
      .update({ challenge_intent: intent, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      console.error('[profile/intent]', error);
      return NextResponse.json({ error: 'update_failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, challenge_intent: intent });
  } catch (err) {
    console.error('[profile/intent]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
