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

-- ---------------------------------------------------------------------------
-- Viral funnel (last 30 days)
-- ---------------------------------------------------------------------------

SELECT
  COUNT(*) FILTER (WHERE event_name = 'landing_page_view') AS landing,
  COUNT(*) FILTER (WHERE event_name = 'challenge_started') AS challenge_started,
  COUNT(*) FILTER (WHERE event_name = 'challenge_completed') AS challenge_completed,
  COUNT(*) FILTER (WHERE event_name = 'training_path_viewed') AS training_bridge,
  COUNT(*) FILTER (WHERE event_name = 'adventures_home_viewed') AS adventure_bridge,
  COUNT(*) FILTER (WHERE event_name = 'signup_completed') AS signups,
  COUNT(*) FILTER (WHERE event_name = 'checkout_completed') AS paid
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days';

-- ---------------------------------------------------------------------------
-- Adult training funnel (last 30 days)
-- ---------------------------------------------------------------------------

SELECT
  COUNT(*) FILTER (WHERE event_name = 'training_path_viewed') AS path_viewed,
  COUNT(*) FILTER (WHERE event_name = 'training_level_started') AS level_started,
  COUNT(*) FILTER (WHERE event_name = 'quiz_started') AS quiz_started,
  COUNT(*) FILTER (WHERE event_name = 'training_level_completed') AS level_completed,
  COUNT(*) FILTER (WHERE event_name = 'training_level_completed' AND (properties->>'passed')::boolean = true) AS passed,
  COUNT(*) FILTER (WHERE event_name = 'xp_awarded') AS xp_events
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days';

-- ---------------------------------------------------------------------------
-- Adventure funnel (last 30 days)
-- ---------------------------------------------------------------------------

SELECT
  COUNT(*) FILTER (WHERE event_name = 'adventures_home_viewed') AS home_viewed,
  COUNT(*) FILTER (WHERE event_name = 'adventure_chapter_started') AS chapter_started,
  COUNT(*) FILTER (WHERE event_name = 'adventure_chapter_completed') AS chapter_completed,
  COUNT(*) FILTER (WHERE event_name = 'chapter_abandoned') AS chapter_abandoned,
  COUNT(*) FILTER (WHERE event_name = 'adventure_story_completed') AS story_completed,
  COUNT(*) FILTER (WHERE event_name = 'adventure_signup_prompt_viewed') AS signup_prompts
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days';

-- ---------------------------------------------------------------------------
-- UTM attribution on funnel steps (last 30 days)
-- ---------------------------------------------------------------------------

SELECT
  properties->>'utm_source' AS utm_source,
  properties->>'utm_campaign' AS utm_campaign,
  event_name,
  COUNT(*) AS events
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND properties->>'utm_source' IS NOT NULL
  AND event_name IN (
    'landing_page_view', 'challenge_started', 'challenge_completed',
    'training_path_viewed', 'training_level_completed',
    'adventures_home_viewed', 'adventure_chapter_completed'
  )
GROUP BY 1, 2, 3
ORDER BY events DESC;

-- ---------------------------------------------------------------------------
-- D7 challenge progression return (approximate — uses anon_id / user_id)
-- Challenge completers who start level 2+ or chapter 2+ within 7 days
-- ---------------------------------------------------------------------------

WITH completers AS (
  SELECT
    COALESCE(user_id::text, properties->>'anon_id') AS actor_id,
    MIN(created_at) AS first_complete_at
  FROM analytics_events
  WHERE event_name = 'challenge_completed'
    AND created_at >= NOW() - INTERVAL '60 days'
    AND COALESCE(user_id::text, properties->>'anon_id') IS NOT NULL
  GROUP BY 1
),
returns AS (
  SELECT DISTINCT
    COALESCE(e.user_id::text, e.properties->>'anon_id') AS actor_id
  FROM analytics_events e
  INNER JOIN completers c
    ON COALESCE(e.user_id::text, e.properties->>'anon_id') = c.actor_id
  WHERE e.event_name IN (
    'app_returned',
    'training_level_started',
    'adventure_chapter_started'
  )
    AND e.created_at > c.first_complete_at
    AND e.created_at <= c.first_complete_at + INTERVAL '7 days'
)
SELECT
  COUNT(*) AS challenge_completers,
  COUNT(r.actor_id) AS returned_within_7d,
  ROUND(100.0 * COUNT(r.actor_id) / NULLIF(COUNT(*), 0), 2) AS d7_return_pct
FROM completers c
LEFT JOIN returns r ON c.actor_id = r.actor_id;

-- ---------------------------------------------------------------------------
-- Challenge comprehension by speed tier (last 30 days)
-- ---------------------------------------------------------------------------

SELECT
  (properties->>'speed_wpm')::int AS speed_wpm,
  AVG((properties->>'comprehension_pct')::numeric) AS avg_comprehension_pct,
  COUNT(*) AS quiz_completions
FROM analytics_events
WHERE event_name = 'challenge_quiz_completed'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1;

-- ---------------------------------------------------------------------------
-- Intent segmentation (last 30 days)
-- ---------------------------------------------------------------------------

SELECT
  properties->>'intent' AS intent,
  COUNT(*) AS selections
FROM analytics_events
WHERE event_name = 'challenge_intent_selected'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY selections DESC;
