'use client';

import { useAuth } from '@/lib/auth-context';
import { getSessionLimitLabel } from '@/lib/plans';

export default function UsageStatus() {
  const { usage, isLoading } = useAuth();

  if (isLoading || usage.isUnlimited) return null;

  return (
    <div className="text-center mb-2">
      <span className="text-xs text-gray-500">
        {getSessionLimitLabel(usage.tier, usage.sessionsUsed, usage.sessionsLimit)}
      </span>
    </div>
  );
}
