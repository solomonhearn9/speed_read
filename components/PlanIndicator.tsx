'use client';

import { useAuth } from '@/lib/auth-context';
import { getDevPlanLabel, getProdPlanLabel } from '@/lib/plans';

const isDev = process.env.NODE_ENV === 'development';
const showInProduction = process.env.NEXT_PUBLIC_SHOW_PLAN_INDICATOR === 'true';

export default function PlanIndicator() {
  const { user, profile, usage, isLoading } = useAuth();

  if (isLoading) return null;

  if (isDev) {
    const plan = getDevPlanLabel(!!user, profile);
    return (
      <div className="fixed bottom-2 left-2 z-20 max-w-xs rounded bg-gray-900/90 border border-gray-800 px-3 py-2 text-[10px] text-gray-500 font-mono leading-relaxed pointer-events-none">
        <div>Plan: {plan}</div>
        <div>User: {user?.id ?? '—'}</div>
        <div>Stripe: {profile?.stripe_customer_id ?? '—'}</div>
        <div>Sessions today: {usage.sessionsUsed}</div>
      </div>
    );
  }

  if (!showInProduction) return null;

  const plan = getProdPlanLabel(!!user, profile);
  if (!plan) return null;

  return (
    <div className="fixed bottom-2 left-2 z-20 rounded bg-gray-900/80 border border-gray-800 px-2 py-1 text-[10px] text-gray-600 font-mono pointer-events-none">
      Plan: {plan}
    </div>
  );
}
