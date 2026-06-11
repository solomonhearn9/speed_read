import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const service = createServiceClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (!userId) break;

      const priceType = session.metadata?.price_type;

      if (priceType === 'lifetime' || session.mode === 'payment') {
        await service.from('profiles').update({
          plan_status: 'lifetime',
          subscription_status: null,
          lifetime_purchase: true,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
      } else if (session.subscription) {
        const subId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;
        await service.from('profiles').update({
          plan_status: 'monthly',
          subscription_status: 'active',
          stripe_subscription_id: subId,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id;
      if (!userId) break;

      const statusMap: Record<string, string> = {
        active: 'active',
        past_due: 'past_due',
        canceled: 'canceled',
        unpaid: 'past_due',
      };
      const subStatus = statusMap[subscription.status] ?? 'canceled';

      await service.from('profiles').update({
        plan_status: subscription.status === 'canceled' ? 'free' : 'monthly',
        subscription_status: subStatus,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      }).eq('id', userId);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id;
      if (!userId) break;

      await service.from('profiles').update({
        plan_status: 'free',
        subscription_status: 'canceled',
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      }).eq('id', userId);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | { id: string } | null };
      const subId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id;
      if (!subId) break;

      const { data: profile } = await service
        .from('profiles')
        .select('id')
        .eq('stripe_subscription_id', subId)
        .single();

      if (profile) {
        await service.from('profiles').update({
          subscription_status: 'past_due',
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
