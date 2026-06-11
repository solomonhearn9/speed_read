import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { isLifetimeProfile } from '@/lib/stripe-profile-sync';
import { isPaidProfile } from '@/lib/plans';

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('[stripe] Checkout rejected: unauthenticated request');
      return NextResponse.json({ error: 'login_required' }, { status: 401 });
    }

    const { priceType } = await request.json();
    if (priceType !== 'monthly' && priceType !== 'lifetime') {
      console.warn('[stripe] Checkout rejected: invalid price type', { priceType, userId: user.id });
      return NextResponse.json({ error: 'invalid_price_type' }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: profile, error: profileError } = await service
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id, plan_status, subscription_status, lifetime_purchase')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[stripe] Checkout failed to load profile', {
        userId: user.id,
        error: profileError.message,
      });
      return NextResponse.json({ error: 'checkout_failed' }, { status: 500 });
    }

    if (isLifetimeProfile(profile)) {
      console.info('[stripe] Checkout rejected: user already has lifetime access', { userId: user.id });
      return NextResponse.json({ error: 'already_lifetime' }, { status: 400 });
    }

    if (priceType === 'monthly' && isPaidProfile(profile as Parameters<typeof isPaidProfile>[0])) {
      console.info('[stripe] Checkout rejected: user already has active subscription', { userId: user.id });
      return NextResponse.json({ error: 'already_subscribed' }, { status: 400 });
    }

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      console.info('[stripe] Creating Stripe customer', { userId: user.id });
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      const { error: customerUpdateError } = await service
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);

      if (customerUpdateError) {
        console.error('[stripe] Failed to save Stripe customer ID', {
          userId: user.id,
          customerId,
          error: customerUpdateError.message,
        });
        return NextResponse.json({ error: 'checkout_failed' }, { status: 500 });
      }
    }

    if (priceType === 'lifetime' && profile?.stripe_subscription_id) {
      try {
        console.info('[stripe] Canceling existing subscription for lifetime upgrade', {
          userId: user.id,
          subscriptionId: profile.stripe_subscription_id,
        });
        await stripe.subscriptions.cancel(profile.stripe_subscription_id);
      } catch (cancelError) {
        console.error('[stripe] Failed to cancel subscription before lifetime checkout', {
          userId: user.id,
          subscriptionId: profile.stripe_subscription_id,
          error: cancelError,
        });
      }
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const priceId =
      priceType === 'monthly'
        ? process.env.STRIPE_PRICE_MONTHLY_ID!
        : process.env.STRIPE_PRICE_LIFETIME_ID!;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: priceType === 'monthly' ? 'subscription' : 'payment',
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=canceled`,
      metadata: {
        supabase_user_id: user.id,
        price_type: priceType,
      },
    };

    if (priceType === 'monthly') {
      sessionParams.subscription_data = {
        metadata: { supabase_user_id: user.id },
      };
    }

    console.info('[stripe] Creating checkout session', {
      userId: user.id,
      priceType,
      customerId,
    });

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.info('[stripe] Checkout session created', {
      userId: user.id,
      sessionId: session.id,
      priceType,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[stripe] Checkout session creation failed:', err);
    return NextResponse.json({ error: 'checkout_failed' }, { status: 500 });
  }
}
