import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { canAccessBillingPortal } from '@/lib/stripe-profile-sync';

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('[stripe] Billing portal rejected: unauthenticated request');
      return NextResponse.json({ error: 'login_required' }, { status: 401 });
    }

    const service = createServiceClient();
    const { data: profile, error: profileError } = await service
      .from('profiles')
      .select('stripe_customer_id, plan_status, subscription_status, lifetime_purchase')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[stripe] Billing portal failed to load profile', {
        userId: user.id,
        error: profileError.message,
      });
      return NextResponse.json({ error: 'portal_failed' }, { status: 500 });
    }

    if (!canAccessBillingPortal(profile)) {
      console.warn('[stripe] Billing portal rejected: ineligible user', {
        userId: user.id,
        planStatus: profile?.plan_status,
        subscriptionStatus: profile?.subscription_status,
      });
      return NextResponse.json({ error: 'not_eligible' }, { status: 400 });
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/`;
    const stripe = getStripe();

    console.info('[stripe] Creating billing portal session', {
      userId: user.id,
      customerId: profile!.stripe_customer_id,
    });

    const session = await stripe.billingPortal.sessions.create({
      customer: profile!.stripe_customer_id!,
      return_url: returnUrl,
    });

    console.info('[stripe] Billing portal session created', {
      userId: user.id,
      sessionId: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[stripe] Billing portal session creation failed:', err);
    return NextResponse.json({ error: 'portal_failed' }, { status: 500 });
  }
}
