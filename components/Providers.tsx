'use client';

import { AuthProvider } from '@/lib/auth-context';
import AnalyticsProvider from './AnalyticsProvider';
import PlanIndicator from './PlanIndicator';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AnalyticsProvider>
        {children}
        <PlanIndicator />
      </AnalyticsProvider>
    </AuthProvider>
  );
}
