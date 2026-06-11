-- Subscription billing state for cancel-at-period-end handling

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;
