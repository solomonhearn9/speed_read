# PostHog Dashboard: Adult Training Funnel

Create a new dashboard named **Adult Training Funnel**.

## 1. Training loop funnel

**Type:** Funnel  
**Conversion window:** 14 days  
**Steps:**

1. `training_path_viewed`
2. `training_level_viewed`
3. `training_level_started`
4. `quiz_started`
5. `quiz_completed`
6. `training_level_completed`
7. `xp_awarded`

**Breakdowns:** `level_id`, `tier_id`, `target_wpm`, `user_type`, `utm_campaign`

## 2. Pass vs fail rate

**Type:** Trends  
**Filter:** `event = training_level_completed`  
**Breakdown:** `passed` (true/false)  
**Secondary:** `mastered` (true/false)

## 3. Level progression

**Type:** Trends  
**Event:** `training_level_completed`  
**Breakdown:** `level_id` or `level_number` property if added client-side

## 4. XP and level-ups

**Type:** Trends  
- `xp_awarded` (sum of `xp_awarded` property)
- `reader_level_up` (count)

## 5. Drop-off: continue with low score

**Type:** Trends  
**Events:** `continue_with_low_score_clicked`, `retry_level_clicked`

## 6. UTM persistence check

**Type:** SQL (HogQL)

```sql
SELECT
  properties.utm_source,
  countIf(event = 'training_path_viewed') AS path_views,
  countIf(event = 'training_level_completed') AS completions
FROM events
WHERE event IN ('training_path_viewed', 'training_level_completed')
  AND timestamp > now() - interval 30 day
GROUP BY 1
ORDER BY completions DESC
```

## Clarity filters

- `training_user` = `true`
- `last_event` contains `training` or `quiz`
