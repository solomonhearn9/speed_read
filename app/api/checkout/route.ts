import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'login_required' }, { status: 401 });
    }

    const { priceType } = await request.json();
    if (priceType !== 'monthly' && priceType !== 'lifetime') {
      return NextResponse.json({ error: 'invalid_price_type' }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: profile } = await service
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await service
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
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

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'checkout_failed' }, { status: 500 });
  }
}
