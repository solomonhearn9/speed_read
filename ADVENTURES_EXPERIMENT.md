# Reading Adventures — Kid Test Experiment

## What this tests

SpeedRead is running a **minimal experiment** to learn whether children (roughly ages 8–14) will voluntarily read themed story chapters on screen and ask for the next one.

This is **not** a kids product yet. It is one story, five chapters, and a themed reading loop.

## Hypotheses

1. Kids will finish Chapter 1 without heavy prompting.
2. Kids will ask what happens next (Chapter 2 desire).
3. Kids will complete multiple chapters in one sitting or return later.
4. Story-choice quizzes indicate comprehension, not just button mashing.
5. Pixel/adventure theming increases attention vs plain adult UI.
6. Voluntary return happens without notifications or rewards beyond XP/clues.

## Metrics that matter (PostHog / Supabase)

| Metric | Event(s) |
|--------|----------|
| Discovery | `adventures_home_viewed`, `adventure_story_viewed` |
| Chapter 1 start | `adventure_chapter_started` (chapter_number = 1) |
| Chapter 1 complete | `adventure_chapter_completed` (chapter 1) |
| Quiz engagement | `adventure_quiz_question_answered`, `adventure_quiz_completed` |
| Pass rate | `passed` property on `adventure_chapter_completed` |
| Chapter 2+ starts | `adventure_chapter_started` (chapter_number ≥ 2) |
| Story finish | `adventure_story_completed` |
| Anonymous → signup | `adventure_signup_prompt_viewed`, `adventure_signup_clicked` |
| Retry intent | `adventure_retry_clicked` |

Break down by `is_logged_in`, `user_plan`, and `source` (landing vs challenge_complete).

## What NOT to infer yet

- Do **not** conclude product-market fit from one story.
- Do **not** compare kid retention to adult training without similar sample size.
- Do **not** treat XP as motivation proof — it may be ignored.
- Do **not** assume comprehension % equals classroom reading level.
- Do **not** expand content library until sibling/family tests show Chapter 2 pull.

## Suggested family test protocol

**Setup:** One child, quiet room, phone or tablet, `/adventures`, no coaching during reading.

**Observe silently, then ask:**

1. Did they finish Chapter 1 without you prompting?
2. Did they ask what happens next?
3. Did they want to continue or replay?
4. Could they summarize what happened in the story?
5. Did they mention the theme (dragon, cave, portal, blocks)?
6. Did they ask to use it again later (same day or next day)?

**Log:** age (approx), device, completed chapters, pass/fail on quiz, quotes.

**Success signal for v2:** ≥2 of 3 test kids finish Chapter 1 and verbally ask for Chapter 2.

## Current scope

- Story: *The Lost Crystal Dragon* (Minecraft-**inspired**, no official IP)
- 5 chapters, 250 WPM default, 3 story-choice questions each
- Signup required for Chapter 1; Chapters 1–2 free; Pro for Chapter 3+
- Chapter 4 (`cave-of-blue-fire`) locks until next calendar day after completing Chapter 3

## If the experiment succeeds

Build next (only then):

- Chapter 2 anonymous drop-off recovery
- Second story arc
- Parent email capture (not dashboard)
- Inventory/clue shelf (lightweight)
- Daily “next chapter” bookmark

## If it fails

Do not add kids content. Double down on adult Continue Learning retention instead.
