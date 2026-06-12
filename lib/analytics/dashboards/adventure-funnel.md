# PostHog Dashboard: Adventure Funnel

Create a new dashboard named **Adventure Funnel** (kids experiment).

## 1. Adventure chapter funnel

**Type:** Funnel  
**Conversion window:** 14 days  
**Steps:**

1. `adventures_home_viewed`
2. `adventure_story_viewed`
3. `adventure_chapter_viewed`
4. `adventure_chapter_started`
5. `adventure_quiz_started`
6. `adventure_quiz_completed`
7. `adventure_chapter_completed`

**Breakdowns:** `story_slug`, `chapter_number`, `is_logged_in`, `utm_campaign`

## 2. Chapter 1 → Chapter 2 desire

**Type:** Funnel  
**Steps:**
1. `adventure_chapter_completed` where `chapter_number` = 1
2. `adventure_chapter_started` where `chapter_number` = 2

**Breakdown:** `passed`, `utm_source`

## 3. Abandonment rate

**Type:** Trends  
**Series A:** `adventure_chapter_started`  
**Series B:** `chapter_abandoned`  
**Series C:** `adventure_chapter_completed`

**Breakdown:** `abandon_phase` (`reader` vs `quiz`), `chapter_number`

## 4. Anonymous → signup conversion

**Type:** Funnel  
**Steps:**
1. `adventure_signup_prompt_viewed`
2. `adventure_signup_clicked`
3. `signup_completed`

## 5. Story completion

**Type:** Trends  
**Event:** `adventure_story_completed`  
**Breakdown:** `story_slug`

## 6. XP from adventures

**Type:** Trends  
**Event:** `adventure_xp_awarded`  
**Sum property:** `xp_awarded`

## Clarity filters

- `adventure_user` = `true`
- `story_slug` = `lost-crystal-dragon`
- `chapter_number` = 1, 2, 3…
- Filter replays with `last_event` = `chapter_abandoned` to watch drop-off
