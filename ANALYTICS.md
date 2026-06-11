# Analytics

Speed Reader sends product analytics to three destinations:

1. **Supabase** (`analytics_events` table) — internal event log, always active when Supabase is configured
2. **PostHog** — funnels, cohorts, and product analytics (optional)
3. **Microsoft Clarity** — session replays and heatmaps (optional)

All tracking goes through `trackEvent()` in `lib/analytics/index.ts`. Events are enriched with first-touch attribution, device type, login state, and plan status before being sent to every adapter.

## Environment variables

Add these to `.env.local` (see `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog project API key. Analytics skips PostHog when empty. |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog ingest host. Default: `https://us.i.posthog.com` |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | No | Clarity project ID. Script loads only when set. |

Clarity does not load in local development unless `NEXT_PUBLIC_CLARITY_PROJECT_ID` is set in your env file.

## PostHog setup

1. Create a project at [posthog.com](https://posthog.com).
2. Copy the **Project API Key** into `NEXT_PUBLIC_POSTHOG_KEY`.
3. For US cloud, keep `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`. For EU, use `https://eu.i.posthog.com`.
4. Deploy with the env vars set. PostHog initializes client-side in `AnalyticsProvider`; missing or invalid keys fail silently.
5. Logged-in users are identified by Supabase user ID with properties: `email`, `plan_status`, `subscription_status`, `lifetime_purchase`.

## Microsoft Clarity setup

1. Create a project at [clarity.microsoft.com](https://clarity.microsoft.com).
2. Go to **Settings → Overview** and copy the project ID.
3. Set `NEXT_PUBLIC_CLARITY_PROJECT_ID` (e.g. `x5l3e54fmk`).
4. Clarity loads asynchronously via `@microsoft/clarity` in `AnalyticsProvider` — it does not block rendering.
5. Logged-in users are identified with their Supabase user ID and email.

## UTM format for social posts

Use consistent UTMs so TikTok, Reels, and Shorts traffic is attributable in PostHog and stored on signup.

**Recommended link format:**

```
https://your-domain.com/?utm_source=tiktok&utm_medium=social&utm_campaign=challenge_v1&utm_content=VIDEO_ID&content_id=VIDEO_ID
```

| Parameter | Example | Purpose |
|-----------|---------|---------|
| `utm_source` | `tiktok`, `instagram`, `youtube` | Platform (also mapped to `source_platform`) |
| `utm_medium` | `social`, `paid`, `creator` | Channel type |
| `utm_campaign` | `challenge_v1`, `wpm_hook_june` | Campaign or creative batch |
| `utm_content` | `7123456789` | Video or post ID |
| `content_id` | Same as `utm_content` | Explicit content ID on events |

First-touch values are captured on the first page load and stored in `localStorage`. They are attached to every analytics event and saved to the user profile on signup (`first_utm_*` columns).

## Core funnel

Primary conversion path for social traffic:

```
landing_page_view
  → challenge_started
  → signup_completed
  → upgrade_modal_viewed
  → checkout_started
  → checkout_completed
```

Supporting events:

- `challenge_completed` — user finishes the 30-second challenge
- `paste_text_started` / `reading_session_started` — reader funnel
- `verification_completed` — email verified
- `paid_user_created` — profile confirmed paid after Stripe return
- Gate/limit events: `upload_gate_viewed`, `url_gate_viewed`, `word_limit_hit`, `session_limit_hit`

## PostHog dashboards to build

### 1. Social acquisition funnel

Steps: `landing_page_view` → `challenge_started` → `signup_completed` → `upgrade_modal_viewed` → `checkout_started` → `checkout_completed`

- Break down by `source_platform`, `utm_campaign`, `utm_content`
- Filter `utm_medium = social`

### 2. Challenge engagement

- Trend: `challenge_started` vs `challenge_completed`
- Break down by `challenge_level`, `source_platform`
- Property: `challenge_score` (WPM tier reached)

### 3. Paywall conversion

- Funnel: `upgrade_modal_viewed` → `checkout_started` → `checkout_completed`
- Break down by `limit_type` (`word`, `session`, `upload`, `url`, `challenge`)
- Break down by `checkout_type` (`monthly` vs `lifetime`)

### 4. Signup quality by source

- Event: `signup_completed`
- Break down by `utm_source`, `first_utm_campaign` (person property after identify)
- Cohort: users who completed checkout within 7 days of signup

### 5. Session behavior (Clarity + PostHog)

- Use Clarity for replays filtered by landing URL with UTM params
- PostHog insight: `reading_session_started` count by `device_type` and `plan_status`

## Event properties reference

Common properties auto-attached to every event:

- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`
- `referrer`, `landing_path`, `source_platform`, `content_id`
- `is_logged_in`, `plan_status`, `device_type`

Event-specific properties:

| Property | Events | Values |
|----------|--------|--------|
| `checkout_type` | checkout_* , paid_user_created | `monthly`, `lifetime` |
| `limit_type` | limit/gate events | `word`, `session`, `upload`, `url`, `challenge` |
| `word_count` | reading_session_started, word_limit_hit | number |
| `wpm`, `challenge_score` | challenge_completed | number |
| `challenge_level` | challenge_started, challenge_completed | 1–3 (free attempts) |

## Code reference

- `lib/analytics/index.ts` — `trackEvent()` entry point
- `lib/analytics/attribution.ts` — first-touch UTM capture
- `lib/analytics/adapters/` — Supabase + PostHog adapters
- `components/AnalyticsProvider.tsx` — PostHog init, Clarity init, user identify
- `app/api/analytics/attribution/route.ts` — persist attribution on signup
