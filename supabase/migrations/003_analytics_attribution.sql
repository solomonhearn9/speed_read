-- First-touch attribution columns for signup source tracking
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_utm_source TEXT,
  ADD COLUMN IF NOT EXISTS first_utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS first_utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS first_utm_content TEXT,
  ADD COLUMN IF NOT EXISTS first_referrer TEXT,
  ADD COLUMN IF NOT EXISTS first_landing_path TEXT;
