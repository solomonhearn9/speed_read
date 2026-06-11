import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import {
  getSubscriptionBillingFields,
  isLifetimeProfile,
  mapSubscriptionStatus,
  planStatusFromSubscription,
  updateProfile,
} from '@/lib/stripe-profile-sync';

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    console.warn('[stripe] Webhook rejected: missing signature');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[stripe] Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.info('[stripe] Webhook received', { eventId: event.id, type: event.type });

  const service = createServiceClient();
  const stripe = getStripe();
  let processingFailed = false;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (!userId) {
        console.warn('[stripe] checkout.session.completed missing supabase_user_id', {
          sessionId: session.id,
        });
        break;
      }

      const priceType = session.metadata?.price_type;

      if (priceType === 'lifetime' || session.mode === 'payment') {
        const { data: profile } = await service
          .from('profiles')
          .select('stripe_subscription_id')
          .eq('id', userId)
          .single();

        if (profile?.stripe_subscription_id) {
          try {
            await stripe.subscriptions.cancel(profile.stripe_subscription_id);
            console.info('[stripe] Canceled subscription after lifetime purchase', {
              userId,
              subscriptionId: profile.stripe_subscription_id,
            });
          } catch (cancelError) {
            console.error('[stripe] Failed to cancel subscription after lifetime purchase', {
              userId,
              error: cancelError,
            });
          }
        }

        const result = await updateProfile(
          service,
          userId,
          {
            plan_status: 'lifetime',
            subscription_status: null,
            lifetime_purchase: true,
            stripe_subscription_id: null,
            subscription_cancel_at_period_end: false,
            subscription_current_period_end: null,
          },
          'checkout.session.completed:lifetime'
        );
        if (!result.ok) processingFailed = true;
      } else if (session.subscription) {
        const subId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;
        const result = await updateProfile(
          service,
          userId,
          {
            plan_status: 'monthly',
            subscription_status: 'active',
            stripe_subscription_id: subId,
            subscription_cancel_at_period_end: false,
            subscription_current_period_end: null,
          },
          'checkout.session.completed:monthly'
        );
        if (!result.ok) processingFailed = true;
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id;
      if (!userId) {
        console.warn('[stripe] subscription.updated missing supabase_user_id', {
          subscriptionId: subscription.id,
        });
        break;
      }

      const { data: profile } = await service
        .from('profiles')
        .select('lifetime_purchase, plan_status')
        .eq('id', userId)
        .single();

      if (isLifetimeProfile(profile)) {
        console.info('[stripe] Skipping subscription.updated for lifetime user', { userId });
        break;
      }

      const subStatus = mapSubscriptionStatus(subscription.status);
      if (!subStatus) {
        console.warn('[stripe] Unmapped subscription status', {
          userId,
          status: subscription.status,
        });
        break;
      }

      const billingFields = getSubscriptionBillingFields(subscription);

      console.info('[stripe] Subscription updated', {
        userId,
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: billingFields.subscription_cancel_at_period_end,
        currentPeriodEnd: billingFields.subscription_current_period_end,
      });

      if (billingFields.subscription_cancel_at_period_end) {
        console.info('[stripe] cancel_at_period_end set — retaining monthly access until period end', {
          userId,
          currentPeriodEnd: billingFields.subscription_current_period_end,
        });
      }

      const result = await updateProfile(
        service,
        userId,
        {
          plan_status: planStatusFromSubscription(subscription.status),
          subscription_status: subStatus,
          stripe_subscription_id: subscription.id,
          ...billingFields,
        },
        'customer.subscription.updated'
      );
      if (!result.ok) processingFailed = true;
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id;
      if (!userId) {
        console.warn('[stripe] subscription.deleted missing supabase_user_id', {
          subscriptionId: subscription.id,
        });
        break;
      }

      const { data: profile } = await service
        .from('profiles')
        .select('lifetime_purchase, plan_status')
        .eq('id', userId)
        .single();

      if (isLifetimeProfile(profile)) {
        console.info('[stripe] Skipping subscription.deleted for lifetime user', { userId });
        break;
      }

      console.info('[stripe] Subscription ended — downgrading user to free', {
        userId,
        subscriptionId: subscription.id,
      });

      const result = await updateProfile(
        service,
        userId,
        {
          plan_status: 'free',
          subscription_status: 'canceled',
          stripe_subscription_id: null,
          subscription_cancel_at_period_end: false,
          subscription_current_period_end: null,
        },
        'customer.subscription.deleted'
      );
      if (!result.ok) processingFailed = true;
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
        .select('id, lifetime_purchase, plan_status')
        .eq('stripe_subscription_id', subId)
        .single();

      if (!profile || isLifetimeProfile(profile)) break;

      const result = await updateProfile(
        service,
        profile.id,
        { subscription_status: 'past_due' },
        'invoice.payment_failed'
      );
      if (!result.ok) processingFailed = true;
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | { id: string } | null };
      const subId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id;
      if (!subId) break;

      const { data: profile } = await service
        .from('profiles')
        .select('id, lifetime_purchase, plan_status')
        .eq('stripe_subscription_id', subId)
        .single();

      if (!profile || isLifetimeProfile(profile)) break;

      const result = await updateProfile(
        service,
        profile.id,
        {
          plan_status: 'monthly',
          subscription_status: 'active',
        },
        'invoice.payment_succeeded'
      );
      if (!result.ok) processingFailed = true;
      break;
    }

    default:
      console.info('[stripe] Unhandled webhook event type', { type: event.type });
  }

  if (processingFailed) {
    console.error('[stripe] Webhook processing failed', { eventId: event.id, type: event.type });
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
