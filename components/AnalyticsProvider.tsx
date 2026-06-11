'use client';

import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';
import { useAuth } from '@/lib/auth-context';
import {
  captureFirstTouchAttribution,
  setAnalyticsContext,
} from '@/lib/analytics';
import {
  identifyPostHogUser,
  initPostHog,
  resetPostHogUser,
} from '@/lib/analytics/adapters/posthog';

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();

  useEffect(() => {
    captureFirstTouchAttribution();
    initPostHog();

    const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
    if (clarityProjectId) {
      try {
        Clarity.init(clarityProjectId);
      } catch {
        // Non-blocking
      }
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (user && profile) {
      setAnalyticsContext({
        is_logged_in: true,
        plan_status: profile.plan_status,
        user_id: user.id,
      });

      identifyPostHogUser(user.id, {
        email: profile.email,
        plan_status: profile.plan_status,
        subscription_status: profile.subscription_status,
        lifetime_purchase: profile.lifetime_purchase,
      });

      const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
      if (clarityProjectId) {
        try {
          Clarity.identify(user.id, undefined, undefined, profile.email);
        } catch {
          // Non-blocking
        }
      }
      return;
    }

    if (user && !profile) {
      setAnalyticsContext({
        is_logged_in: true,
        plan_status: 'free',
        user_id: user.id,
      });

      identifyPostHogUser(user.id, {
        email: user.email ?? undefined,
      });
      return;
    }

    setAnalyticsContext({
      is_logged_in: false,
      plan_status: 'anonymous',
      user_id: null,
    });
    resetPostHogUser();
  }, [user, profile, isLoading]);

  return <>{children}</>;
}
