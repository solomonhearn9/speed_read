-- Conversion funnel metrics for speed_read analytics_events table.
-- Run with service-role access in Supabase SQL editor or psql.
-- Replace date filters as needed.

-- ---------------------------------------------------------------------------
-- Funnel stage counts (all time)
-- ---------------------------------------------------------------------------

SELECT
  COUNT(*) FILTER (WHERE event_name = 'landing_page_view') AS landing_page_views,
  COUNT(*) FILTER (WHERE event_name = 'reading_session_started') AS reading_sessions_started,
  COUNT(*) FILTER (WHERE event_name = 'upgrade_modal_viewed') AS upgrade_modal_views,
  COUNT(*) FILTER (WHERE event_name IN ('checkout_started', 'checkout_started_monthly', 'checkout_started_lifetime')) AS checkouts_started,
  COUNT(*) FILTER (WHERE event_name = 'checkout_completed') AS checkouts_completed
FROM analytics_events;

-- ---------------------------------------------------------------------------
-- Conversion rates
-- ---------------------------------------------------------------------------

WITH counts AS (
  SELECT
    COUNT(*) FILTER (WHERE event_name = 'landing_page_view')::numeric AS landing,
    COUNT(*) FILTER (WHERE event_name = 'reading_session_started')::numeric AS reader_start,
    COUNT(*) FILTER (WHERE event_name = 'upgrade_modal_viewed')::numeric AS paywall,
    COUNT(*) FILTER (WHERE event_name IN ('checkout_started', 'checkout_started_monthly', 'checkout_started_lifetime'))::numeric AS checkout,
    COUNT(*) FILTER (WHERE event_name = 'checkout_completed')::numeric AS paid
  FROM analytics_events
)
SELECT
  ROUND(100.0 * reader_start / NULLIF(landing, 0), 2) AS landing_to_reader_pct,
  ROUND(100.0 * paywall / NULLIF(reader_start, 0), 2) AS reader_to_paywall_pct,
  ROUND(100.0 * checkout / NULLIF(paywall, 0), 2) AS paywall_to_checkout_pct,
  ROUND(100.0 * paid / NULLIF(checkout, 0), 2) AS checkout_to_paid_pct,
  ROUND(100.0 * paid / NULLIF(landing, 0), 2) AS visitor_to_paid_pct
FROM counts;

-- ---------------------------------------------------------------------------
-- Daily funnel (last 30 days)
-- ---------------------------------------------------------------------------

SELECT
  DATE(created_at) AS day,
  COUNT(*) FILTER (WHERE event_name = 'landing_page_view') AS landing,
  COUNT(*) FILTER (WHERE event_name = 'reading_session_started') AS reader_start,
  COUNT(*) FILTER (WHERE event_name = 'upgrade_modal_viewed') AS paywall,
  COUNT(*) FILTER (WHERE event_name IN ('checkout_started', 'checkout_started_monthly', 'checkout_started_lifetime')) AS checkout,
  COUNT(*) FILTER (WHERE event_name = 'checkout_completed') AS paid
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY day DESC;
