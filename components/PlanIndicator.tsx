'use client';

import { useAuth } from '@/lib/auth-context';
import { getProdPlanLabel } from '@/lib/plans';

const showInProduction = process.env.NEXT_PUBLIC_SHOW_PLAN_INDICATOR === 'true';

export default function PlanIndicator() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) return null;

  if (!showInProduction) return null;

  const plan = getProdPlanLabel(!!user, profile);
  if (!plan) return null;

  return (
    <div className="fixed bottom-2 left-2 z-20 rounded bg-gray-900/80 border border-gray-800 px-2 py-1 text-[10px] text-gray-600 font-mono pointer-events-none">
      Plan: {plan}
    </div>
  );
}
