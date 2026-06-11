'use client';

import { AuthProvider } from '@/lib/auth-context';
import PlanIndicator from './PlanIndicator';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <PlanIndicator />
    </AuthProvider>
  );
}
