-- Kid pacing tweaks + access_tier gating model + challenge intent persistence

-- ── Access tiers on content ──────────────────────────────────────────────────
-- free | signup | subscription (defaults applied by number if null)

ALTER TABLE training_levels
  ADD COLUMN IF NOT EXISTS access_tier text
  CHECK (access_tier IS NULL OR access_tier IN ('free', 'signup', 'subscription'));

ALTER TABLE adventure_chapters
  ADD COLUMN IF NOT EXISTS access_tier text
  CHECK (access_tier IS NULL OR access_tier IN ('free', 'signup', 'subscription'));

-- Level/chapter 1: free (anonymous playable)
UPDATE training_levels SET access_tier = 'free' WHERE level_number = 1;
UPDATE adventure_chapters SET access_tier = 'free' WHERE chapter_number = 1;

-- Level/chapter 2: signup (free account after ch.1 cliffhanger)
UPDATE training_levels SET access_tier = 'signup' WHERE level_number = 2;
UPDATE adventure_chapters SET access_tier = 'signup' WHERE chapter_number = 2;

-- Level/chapter 3+: subscription (current Pro boundary)
UPDATE training_levels SET access_tier = 'subscription' WHERE level_number >= 3;
UPDATE adventure_chapters SET access_tier = 'subscription' WHERE chapter_number >= 3;

-- Kid pacing: gentler early chapters
UPDATE adventure_chapters SET target_wpm = 175 WHERE chapter_number = 1;
UPDATE adventure_chapters SET target_wpm = 200 WHERE chapter_number = 2;

-- ── Router intent on profile (signed-in persistence) ─────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS challenge_intent text;
