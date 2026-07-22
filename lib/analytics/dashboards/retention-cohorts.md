# PostHog Dashboard: D7 Retention Cohorts

Create a dashboard named **Retention — Challenge Cohorts** in PostHog.

## 1. D7 retention — challenge completers (primary)

**Type:** Retention  
**Cohort event:** `challenge_completed`  
**Return event:** any of:
- `app_returned`
- `challenge_started`
- `training_level_started`
- `adventure_chapter_started`

**Period:** Weekly or daily (daily for first 30 days of campaign)  
**Breakdowns:** `intent` (from `challenge_intent_selected`), `utm_campaign`, `utm_content`

## 2. Challenge → progression within 7 days

**Type:** Funnel  
**Conversion window:** 7 days  
**Steps:**
1. `challenge_completed`
2. `challenge_quiz_completed`
3. `challenge_intent_selected` (optional)
4. `training_level_started` OR `adventure_chapter_started`
5. `signup_completed`

## 3. Share loop effectiveness

**Type:** Trends  
**Series A:** `challenge_completed` (count)  
**Series B:** `share_clicked` (count)  
**Series C:** `viral_test_shared` (count)  
**Formula:** B/A and C/A as percentages

## 4. Comprehension at speed (table)

**Type:** SQL (HogQL)

```sql
SELECT
  round(toFloat(properties.speed_wpm) / 100) * 100 AS speed_bucket,
  avg(toFloat(properties.comprehension_pct)) AS avg_comprehension,
  count() AS sessions
FROM events
WHERE event = 'challenge_quiz_completed'
  AND timestamp > now() - interval 30 day
GROUP BY 1
ORDER BY 1
```

## Supabase equivalent

See `lib/analytics/funnel-metrics.sql` — section **D7 challenge progression return**.
