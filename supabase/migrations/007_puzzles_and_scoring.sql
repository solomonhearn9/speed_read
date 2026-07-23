-- Puzzle reveal progression + league-ready scoring (data layer)

-- ═══════════════════════════════════════════════════════════════════════════
-- Puzzles
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track TEXT NOT NULL CHECK (track IN ('adult', 'kids')),
  full_image_url TEXT NOT NULL,
  segment_count INT NOT NULL CHECK (segment_count > 0),
  title TEXT NOT NULL,
  reveal_message TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_puzzles_track_sort ON puzzles(track, sort_order);

ALTER TABLE training_levels
  ADD COLUMN IF NOT EXISTS puzzle_image_id UUID REFERENCES puzzles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS segment_index INT;

ALTER TABLE adventure_chapters
  ADD COLUMN IF NOT EXISTS puzzle_image_id UUID REFERENCES puzzles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS segment_index INT;

-- Seed puzzles (titles/messages stay server-side until full reveal)
INSERT INTO puzzles (id, track, full_image_url, segment_count, title, reveal_message, sort_order) VALUES
(
  'f6000001-0000-4000-8000-000000000001',
  'adult',
  '/adult_card.png',
  5,
  'The Reader''s Journey',
  'You uncovered the full path. Every level carved another piece of the picture.',
  1
),
(
  'f6000001-0000-4000-8000-000000000002',
  'kids',
  '/kids_hero.png',
  5,
  'The Lost Crystal Dragon',
  'The crystal dragon is whole again — you revealed the adventure one chapter at a time.',
  1
)
ON CONFLICT (id) DO NOTHING;

UPDATE training_levels SET
  puzzle_image_id = 'f6000001-0000-4000-8000-000000000001',
  segment_index = level_number
WHERE slug IN ('bronze-1', 'bronze-2', 'bronze-3', 'bronze-4', 'bronze-5');

UPDATE adventure_chapters SET
  puzzle_image_id = 'f6000001-0000-4000-8000-000000000002',
  segment_index = chapter_number
WHERE story_id = 'e5000001-0000-4000-8000-000000000001';

ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read puzzles" ON puzzles;
CREATE POLICY "Anyone can read puzzles"
  ON puzzles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role manages puzzles" ON puzzles;
CREATE POLICY "Service role manages puzzles"
  ON puzzles FOR ALL
  USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- Scoring (league-ready; no public leaderboard UI yet)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS score_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level_id TEXT NOT NULL,
  track TEXT NOT NULL CHECK (track IN ('adult', 'kids')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  comprehension_result INT NOT NULL CHECK (comprehension_result IN (0, 1, 2, 3)),
  wpm INT NOT NULL,
  computed_score NUMERIC(10, 2) NOT NULL,
  streak_bonus_applied NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_score_events_user ON score_events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_score_events_track ON score_events(track, timestamp DESC);

CREATE TABLE IF NOT EXISTS user_scores (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  track TEXT NOT NULL CHECK (track IN ('adult', 'kids')),
  total_score NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_verified_completions INT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  best_streak INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, track)
);

-- Cheap leaderboard ranking later: ORDER BY total_score DESC
CREATE INDEX IF NOT EXISTS idx_user_scores_track_score ON user_scores(track, total_score DESC);

ALTER TABLE score_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own score events" ON score_events;
CREATE POLICY "Users can read own score events"
  ON score_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages score events" ON score_events;
CREATE POLICY "Service role manages score events"
  ON score_events FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read own scores" ON user_scores;
CREATE POLICY "Users can read own scores"
  ON user_scores FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages user scores" ON user_scores;
CREATE POLICY "Service role manages user scores"
  ON user_scores FOR ALL
  USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- Profile: display_name (leaderboard handle) + class_code (classroom pilot)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS class_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_display_name_unique
  ON profiles (display_name)
  WHERE display_name IS NOT NULL;

-- Animal+number default handles (never derived from email)
CREATE OR REPLACE FUNCTION generate_display_name()
RETURNS TEXT AS $$
DECLARE
  animals TEXT[] := ARRAY[
    'otter', 'falcon', 'lynx', 'heron', 'badger', 'osprey', 'marten', 'kite',
    'stoat', 'eagle', 'fox', 'wolf', 'hawk', 'raven', 'puma', 'crane',
    'swift', 'ibex', 'mink', 'tern'
  ];
  adjectives TEXT[] := ARRAY[
    'swift', 'bright', 'keen', 'bold', 'calm', 'quick', 'sharp', 'steady',
    'nimble', 'clear', 'brave', 'fleet'
  ];
  candidate TEXT;
  attempts INT := 0;
BEGIN
  LOOP
    candidate := adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
      || '-'
      || animals[1 + floor(random() * array_length(animals, 1))::int]
      || '-'
      || (100 + floor(random() * 900))::int::text;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE display_name = candidate);
    attempts := attempts + 1;
    IF attempts > 20 THEN
      candidate := candidate || '-' || substr(md5(random()::text), 1, 4);
      EXIT;
    END IF;
  END LOOP;
  RETURN candidate;
END;
$$ LANGUAGE plpgsql;

-- Backfill existing profiles
UPDATE profiles
SET display_name = generate_display_name()
WHERE display_name IS NULL;

ALTER TABLE profiles
  ALTER COLUMN display_name SET DEFAULT generate_display_name();

-- Ensure new signups always get a handle, independent of email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, generate_display_name());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
