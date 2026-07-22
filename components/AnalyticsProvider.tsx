'use client';

import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';
import { useAuth } from '@/lib/auth-context';
import {
  applyInitialClarityTags,
  captureFirstTouchAttribution,
  setAnalyticsContext,
  setClarityReady,
} from '@/lib/analytics';
import { ensureAnonPostHogIdentity, mergeAnonIdentityOnSignup } from '@/lib/analytics/anon-id';
import {
  identifyPostHogUser,
  initPostHog,
  registerPostHogAttribution,
  resetPostHogUser,
} from '@/lib/analytics/adapters/posthog';
import { deriveUserType } from '@/lib/analytics/session-flags';
import { applyClarityTag } from '@/lib/analytics/clarity-tags';

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();

  useEffect(() => {
    captureFirstTouchAttribution();
    initPostHog();
    registerPostHogAttribution();
    ensureAnonPostHogIdentity();

    const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
    if (clarityProjectId) {
      try {
        Clarity.init(clarityProjectId);
        setClarityReady(true);
        applyInitialClarityTags();
      } catch {
        // Non-blocking
      }
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (user && profile) {
      mergeAnonIdentityOnSignup(user.id);
      const userType = deriveUserType(true, profile.plan_status);
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
        user_type: userType,
      });

      applyClarityTag('user_type', userType);

      const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
      if (clarityProjectId) {
        try {
          Clarity.identify(user.id, undefined, undefined, profile.email);
        } catch {
          // Non-blocking
        }
      }
      applyInitialClarityTags();
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
        user_type: 'free',
      });
      applyClarityTag('user_type', 'free');
      applyInitialClarityTags();
      return;
    }

    setAnalyticsContext({
      is_logged_in: false,
      plan_status: 'anonymous',
      user_id: null,
    });
    resetPostHogUser();
    applyClarityTag('user_type', 'anonymous');
    applyInitialClarityTags();
  }, [user, profile, isLoading]);

  return <>{children}</>;
}
