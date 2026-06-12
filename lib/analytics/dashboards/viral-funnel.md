# PostHog Dashboard: Viral Funnel

Create a new dashboard named **Viral Funnel** in PostHog with these insights.

## 1. Viral acquisition funnel (primary)

**Type:** Funnel  
**Conversion window:** 7 days  
**Steps:**

1. `landing_page_view`
2. `challenge_started`
3. `challenge_completed`
4. `training_path_viewed` OR `adventures_home_viewed` (optional bridge — use two funnels if OR not supported)
5. `signup_completed`
6. `checkout_started`
7. `checkout_completed`

**Recommended split:** Create two bridge funnels:
- **Viral → Adult:** steps 1–3 → `training_path_viewed` → `training_level_started`
- **Viral → Adventure:** steps 1–3 → `adventures_home_viewed` → `adventure_chapter_started`

**Breakdowns:** `source_platform`, `utm_campaign`, `utm_content`, `device_type`

## 2. Challenge completion rate

**Type:** Trends  
**Series A:** `challenge_started` (count)  
**Series B:** `challenge_completed` (count)  
**Formula insight:** B/A as percentage

**Breakdown:** `challenge_level`, `utm_source`

## 3. Challenge → monetization

**Type:** Funnel  
**Steps:** `challenge_completed` → `upgrade_modal_viewed` → `checkout_started` → `checkout_completed`  
**Filter:** `reason` = `challenge_complete` OR `challenge_limit` where available

## 4. UTM-attributed viral starts (table)

**Type:** SQL (HogQL)

```sql
SELECT
  properties.utm_source,
  properties.utm_campaign,
  properties.utm_content,
  count() AS challenge_starts
FROM events
WHERE event = 'challenge_started'
  AND timestamp > now() - interval 30 day
GROUP BY 1, 2, 3
ORDER BY challenge_starts DESC
```

## Clarity filters for this dashboard

Filter session replays by custom tags:
- `last_event` contains `challenge`
- `utm_campaign` = your campaign slug
- `challenge_completed` = `true`
