# Analytics Implementation Audit

Last updated: after Clarity adapter + funnel dashboard definitions.

## Destinations per `trackEvent()`

| Destination | Receives all events? | Mechanism |
|-------------|---------------------|-----------|
| **Supabase** | Yes | `supabaseAnalyticsAdapter` → `POST /api/analytics` |
| **PostHog** | Yes | `posthogAnalyticsAdapter` → `posthog.capture()` |
| **Clarity** | Yes (when `NEXT_PUBLIC_CLARITY_PROJECT_ID` set) | `clarityAnalyticsAdapter` → `Clarity.event()` + `Clarity.setTag()` |

All events pass through `enrichEventProperties()` first (UTM, `user_type`, session flags, device, plan).

## UTM attribution persistence

| Layer | Persists UTMs? |
|-------|----------------|
| `localStorage` first-touch | Yes — `captureFirstTouchAttribution()` on first load |
| Every event payload | Yes — merged in `enrichEventProperties()` |
| PostHog super properties | Yes — `registerPostHogAttribution()` on init |
| PostHog identify | Yes — `first_utm_*` on `identifyPostHogUser()` |
| Clarity custom tags | Yes — `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `source_platform` |
| Supabase profile on signup | Yes — `/api/analytics/attribution` |

## Clarity custom tags

| Tag | When set |
|-----|----------|
| `user_type` | `anonymous` / `free` / `paid` — on init + every event |
| `challenge_completed` | `true` after `challenge_completed` event (session) |
| `training_user` | `true` after training path/level events (session) |
| `adventure_user` | `true` after adventure home/chapter events (session) |
| `chapter_number` | Latest adventure event with `chapter_number` |
| `story_slug` | Latest adventure event with `story_slug` |
| `utm_*` / `source_platform` | From first-touch attribution |
| `last_event` | Most recent event name |

Filter Clarity replays: **Filters → Custom tags**.

## Session flags (also on every event)

- `challenge_completed` (boolean)
- `training_user` (boolean)
- `adventure_user` (boolean)
- `user_type` (string)

## Events defined but NOT fired in UI

| Event | Status |
|-------|--------|
| `invite_modal_viewed` | Defined only — no UI hook |
| `invite_sent` | Defined only |
| `referral_link_copied` | Defined only |

## New events (viral retention engine)

| Event | Where fired |
|-------|-------------|
| `challenge_quiz_started` | `ViralTestQuiz` after challenge timer |
| `challenge_quiz_completed` | `ViralTestQuiz` after 3 questions |
| `challenge_intent_selected` | `ViralTestResults` intent buttons |
| `app_returned` | `ContentInput` on return visit |
| `share_clicked` | `ViralTestResults` share button |
| `copy_link_clicked` | `ViralTestResults` clipboard fallback |
| `viral_test_shared` | `ViralTestResults` after share/copy |
| `chapter_abandoned` | Adventure chapter page — tab hide / navigate away |

## Funnel dashboards

See `lib/analytics/dashboards/`:

- `viral-funnel.md`
- `adult-training-funnel.md`
- `adventure-funnel.md`

Create manually in PostHog UI (no API key in repo). Supabase SQL queries in `funnel-metrics.sql`.

## Verification checklist

1. Set `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_CLARITY_PROJECT_ID` in `.env.local`
2. Open app with `?utm_source=test&utm_campaign=audit`
3. Complete viral challenge → confirm `challenge_completed` in PostHog Live Events
4. Open Clarity → session tags show `utm_source=test`, `challenge_completed=true`
5. Open `/train` → `training_user=true` tag
6. Open `/adventures/.../vanished-egg` → start reading → navigate away → `chapter_abandoned` fires once
7. Check Supabase `analytics_events` — same events with full `properties` JSONB
