-- Adult reading training schema

-- Profile progression columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS total_xp INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reader_level INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS current_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_training_date DATE;

-- Content tables
CREATE TABLE IF NOT EXISTS passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  word_count INT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  passage_id UUID NOT NULL REFERENCES passages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  sort_order INT NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_paid_only BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id UUID NOT NULL REFERENCES training_tiers(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  level_number INT NOT NULL,
  target_wpm INT NOT NULL,
  passage_id UUID NOT NULL REFERENCES passages(id),
  quiz_id UUID NOT NULL REFERENCES quizzes(id),
  xp_base INT NOT NULL DEFAULT 10,
  xp_pass INT NOT NULL DEFAULT 25,
  xp_mastery INT NOT NULL DEFAULT 40,
  min_correct_to_pass INT NOT NULL DEFAULT 2,
  is_paid_only BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tier_id, level_number)
);

CREATE TABLE IF NOT EXISTS user_level_progress (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES training_levels(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked', 'completed', 'mastered')),
  unlocked_at TIMESTAMPTZ,
  first_completed_at TIMESTAMPTZ,
  best_wpm INT,
  best_comprehension_pct INT,
  best_quiz_score INT,
  attempts_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, level_id)
);

CREATE TABLE IF NOT EXISTS level_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES training_levels(id) ON DELETE CASCADE,
  passage_id UUID NOT NULL REFERENCES passages(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  target_wpm INT NOT NULL,
  actual_wpm INT,
  word_count INT NOT NULL,
  words_read INT,
  elapsed_seconds INT,
  quiz_score INT,
  questions_correct INT,
  questions_total INT NOT NULL DEFAULT 3,
  comprehension_pct INT,
  xp_awarded INT NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  mastered BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT NOT NULL DEFAULT 'training',
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_levels_tier ON training_levels(tier_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_user_level_progress_user ON user_level_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_level_attempts_user_level ON level_attempts(user_id, level_id);
CREATE INDEX IF NOT EXISTS idx_level_attempts_created ON level_attempts(created_at);

-- RLS
ALTER TABLE passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_level_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read passages" ON passages;
CREATE POLICY "Anyone can read passages" ON passages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read quizzes" ON quizzes;
CREATE POLICY "Anyone can read quizzes" ON quizzes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read quiz questions" ON quiz_questions;
CREATE POLICY "Anyone can read quiz questions" ON quiz_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read training tiers" ON training_tiers;
CREATE POLICY "Anyone can read training tiers" ON training_tiers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read training levels" ON training_levels;
CREATE POLICY "Anyone can read training levels" ON training_levels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users read own level progress" ON user_level_progress;
CREATE POLICY "Users read own level progress"
  ON user_level_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own attempts" ON level_attempts;
CREATE POLICY "Users read own attempts"
  ON level_attempts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages training content" ON passages;
CREATE POLICY "Service role manages training content" ON passages FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role manages quizzes" ON quizzes;
CREATE POLICY "Service role manages quizzes" ON quizzes FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role manages quiz questions" ON quiz_questions;
CREATE POLICY "Service role manages quiz questions" ON quiz_questions FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role manages training tiers" ON training_tiers;
CREATE POLICY "Service role manages training tiers" ON training_tiers FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role manages training levels" ON training_levels;
CREATE POLICY "Service role manages training levels" ON training_levels FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role manages user progress" ON user_level_progress;
CREATE POLICY "Service role manages user progress" ON user_level_progress FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role manages level attempts" ON level_attempts;
CREATE POLICY "Service role manages level attempts" ON level_attempts FOR ALL USING (auth.role() = 'service_role');

-- Seed: Bronze Reader tier + 5 levels
-- Fixed UUIDs for idempotent seed

INSERT INTO passages (id, slug, title, body, word_count, difficulty) VALUES
(
  'a1000001-0000-4000-8000-000000000001',
  'voynich-manuscript',
  'The Book Nobody Can Read',
  'In 1912, a Polish book dealer named Wilfrid Voynich purchased a strange manuscript that would puzzle scholars for over a century. The book contains roughly 240 pages of handwritten text, accompanied by bizarre illustrations of unidentifiable plants, circular diagrams, and naked women bathing in green liquid.

The script is written in an unknown alphabet. No one has ever identified the language. Cryptographers from both World Wars tried to crack it. Modern AI models have tried. None have produced a convincing translation.

Some researchers believe it is a sophisticated hoax created by a medieval con artist. Others think it encodes a lost natural science, perhaps herbal medicine written in a private cipher. A few believe it is simply nonsense generated to look meaningful.

What makes the Voynich manuscript fascinating is not whether we will ever read it. It is what our failure reveals about human pattern recognition. We see structure where none may exist. We hunt for meaning because meaning feels safer than mystery.

The manuscript sits in Yale''s Beinecke Library today, digitized and freely available online. Thousands of amateurs still study it each year. Most will find nothing. A handful will feel, for a moment, that they almost understand.',
  198,
  'beginner'
),
(
  'a1000001-0000-4000-8000-000000000002',
  'cognitive-load',
  'Why Your Brain Feels Full',
  'In the 1980s, psychologist John Sweller proposed a simple idea that changed how we think about learning: your working memory has strict limits. You can hold only a few chunks of information at once. When those slots fill up, learning slows dramatically.

Cognitive load theory divides mental effort into three types. Intrinsic load comes from the material itself — calculus is harder than addition. Extraneous load comes from poor presentation — cluttered slides, confusing instructions. Germane load is the productive effort of actually building understanding.

Most modern frustration is extraneous load wearing a disguise. Notifications, tab switching, and half-read messages do not just steal time. They occupy the same limited memory slots you need for deep reading.

This is why speed reading techniques that eliminate eye movement can feel easier at high speeds. You remove extraneous visual search. Your brain allocates more capacity to comprehension.

The practical lesson is not to eliminate all distraction — that is impossible. It is to protect the first five minutes of any reading session. Those minutes determine whether germane load kicks in or extraneous noise wins.

Readers who understand cognitive load stop blaming willpower. They redesign the environment instead.',
  186,
  'beginner'
),
(
  'a1000001-0000-4000-8000-000000000003',
  'tardigrade',
  'The Animal That Refuses to Die',
  'Tardigrades are microscopic eight-legged creatures found in moss, ocean sediment, and mountain streams. They are often called water bears. They look like tiny, squishy suitcases with legs.

What makes them remarkable is not their appearance. It is their refusal to die under conditions that destroy every other animal. Tardigrades have survived temperatures near absolute zero and above 150 degrees Celsius. They have endured radiation doses hundreds of times higher than lethal levels for humans. In 2007, scientists sent them to the vacuum of space. Most came back alive.

When conditions turn hostile, tardigrades enter a state called cryptobiosis. They expel nearly all water from their bodies, curl into a dry tun, and suspend metabolism. In this state they are not really alive in the usual sense. They are paused — a biological bookmark waiting for better chapters.

Rehydration can restart their systems in minutes. Some tardigrade species have been revived after thirty years of desiccation.

Scientists study them for clues about extreme survival, but tardigrades also raise a stranger question. If life can pause this completely, where is the line between living and waiting?',
  198,
  'intermediate'
),
(
  'a1000001-0000-4000-8000-000000000004',
  'two-minute-rule',
  'The Two-Minute Rule That Actually Works',
  'David Allen''s Getting Things Done system includes a deceptively small rule: if a task takes less than two minutes, do it immediately. The rule was never meant to optimize productivity in the abstract. It was designed to prevent small obligations from colonizing working memory.

Every unfinished task carries a hidden cost. Your brain tracks open loops. A reply you meant to send, a form you meant to fill out, a bill you meant to schedule — each one occupies a sliver of attention even when you are doing something else. Psychologists call this the Zeigarnik effect.

The two-minute rule works because it closes loops before they accumulate interest. Sending the email now is cheaper than carrying it mentally for three days.

But the rule has a failure mode. People use it to avoid harder work by manufacturing endless two-minute tasks. Cleaning the inbox feels productive while the important draft sits untouched.

The fix is pairing the rule with intention. Two-minute tasks are for maintenance, not avoidance. Do them quickly, then return to the one thing that actually moves the day forward.

Speed readers benefit from the same principle. Clear the small reading queue — newsletters, short updates — in focused bursts. Protect longer sessions for material that requires sustained attention.',
  210,
  'intermediate'
),
(
  'a1000001-0000-4000-8000-000000000005',
  'loss-aversion-pricing',
  'Why Free Trials End on Tuesday',
  'In 1979, psychologists Daniel Kahneman and Amos Tversky published prospect theory, explaining that losses feel roughly twice as painful as equivalent gains feel good. Lose one hundred dollars and the sting outweighs the joy of finding one hundred.

Businesses weaponize this asymmetry constantly. Free trials end on weekdays when you are busy. Subscriptions auto-renew at midnight. Cancellation flows require six clicks and a phone call.

The honest version of loss aversion also helps good businesses. A product that genuinely saves time creates fear of losing access — not through manipulation, but through real value delivered.

Consider how reading speed compounds. Saving twenty minutes daily is not twenty minutes. Over a year it is more than one hundred hours — time that can shift careers, relationships, and health. The loss of that compound gain is what makes reading skills worth investing in.

Smart pricing aligns with this psychology without exploiting it. Lifetime access works when users believe the tool will remain valuable for years. Monthly access works when users want a low-risk experiment.

The adult lesson is to notice when loss aversion is being used on you — and when it is accurately telling you that something matters.',
  198,
  'intermediate'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO quizzes (id, slug, passage_id) VALUES
('b2000001-0000-4000-8000-000000000001', 'quiz-voynich', 'a1000001-0000-4000-8000-000000000001'),
('b2000001-0000-4000-8000-000000000002', 'quiz-cognitive-load', 'a1000001-0000-4000-8000-000000000002'),
('b2000001-0000-4000-8000-000000000003', 'quiz-tardigrade', 'a1000001-0000-4000-8000-000000000003'),
('b2000001-0000-4000-8000-000000000004', 'quiz-two-minute', 'a1000001-0000-4000-8000-000000000004'),
('b2000001-0000-4000-8000-000000000005', 'quiz-loss-aversion', 'a1000001-0000-4000-8000-000000000005')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO quiz_questions (quiz_id, sort_order, prompt, options, correct_index) VALUES
('b2000001-0000-4000-8000-000000000001', 1, 'Who purchased the Voynich manuscript in 1912?',
 '["Wilfrid Voynich", "John Sweller", "Daniel Kahneman", "David Allen"]', 0),
('b2000001-0000-4000-8000-000000000001', 2, 'Where is the Voynich manuscript housed today?',
 '["Yale''s Beinecke Library", "The British Museum", "The Vatican Archives", "The Library of Congress"]', 0),
('b2000001-0000-4000-8000-000000000001', 3, 'What does the passage suggest our failure to decode the manuscript reveals?',
 '["How pattern recognition can mislead us", "That medieval science was superior", "That AI cannot analyze images", "That all ancient books are hoaxes"]', 0),

('b2000001-0000-4000-8000-000000000002', 1, 'Who proposed cognitive load theory?',
 '["John Sweller", "Wilfrid Voynich", "Amos Tversky", "David Allen"]', 0),
('b2000001-0000-4000-8000-000000000002', 2, 'Which type of load comes from poor presentation?',
 '["Extraneous load", "Intrinsic load", "Germane load", "Cognitive surplus"]', 0),
('b2000001-0000-4000-8000-000000000002', 3, 'What does the passage recommend protecting at the start of a reading session?',
 '["The first five minutes", "The last five minutes", "Exactly thirty seconds", "The entire first chapter"]', 0),

('b2000001-0000-4000-8000-000000000003', 1, 'What are tardigrades commonly called?',
 '["Water bears", "Space worms", "Moss spiders", "Dry crabs"]', 0),
('b2000001-0000-4000-8000-000000000003', 2, 'What state do tardigrades enter during extreme conditions?',
 '["Cryptobiosis", "Photosynthesis", "Metamorphosis", "Hibernation only"]', 0),
('b2000001-0000-4000-8000-000000000003', 3, 'What happened when tardigrades were sent to space in 2007?',
 '["Most survived and came back alive", "All died instantly", "They mutated into larger animals", "They could not be rehydrated"]', 0),

('b2000001-0000-4000-8000-000000000004', 1, 'The two-minute rule comes from which system?',
 '["Getting Things Done", "Cognitive Load Theory", "Prospect Theory", "Speed Reading Method"]', 0),
('b2000001-0000-4000-8000-000000000004', 2, 'What psychological effect describes unfinished tasks lingering in memory?',
 '["The Zeigarnik effect", "The Voynich effect", "The Tardigrade effect", "The Sweller effect"]', 0),
('b2000001-0000-4000-8000-000000000004', 3, 'What failure mode does the passage warn about?',
 '["Using small tasks to avoid harder work", "Reading too quickly", "Ignoring all email", "Never taking breaks"]', 0),

('b2000001-0000-4000-8000-000000000005', 1, 'Who published prospect theory in 1979?',
 '["Kahneman and Tversky", "Allen and Sweller", "Voynich and Yale", "Sweller and Allen"]', 0),
('b2000001-0000-4000-8000-000000000005', 2, 'According to the passage, losses feel about how much stronger than gains?',
 '["Twice as painful", "Equal", "Half as strong", "Ten times stronger"]', 0),
('b2000001-0000-4000-8000-000000000005', 3, 'What does the passage say lifetime access works best when?',
 '["Users believe the tool will stay valuable for years", "Users forget to cancel", "Users fear Tuesday deadlines", "Users avoid all subscriptions"]', 0);

INSERT INTO training_tiers (id, slug, title, description, sort_order, is_paid_only) VALUES
(
  'c3000001-0000-4000-8000-000000000001',
  'bronze-reader',
  'Bronze Reader',
  'Build your reading speed foundation with short, engaging passages.',
  1,
  false
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO training_levels (id, tier_id, slug, title, level_number, target_wpm, passage_id, quiz_id, sort_order) VALUES
('d4000001-0000-4000-8000-000000000001', 'c3000001-0000-4000-8000-000000000001', 'bronze-1', 'The Book Nobody Can Read', 1, 200, 'a1000001-0000-4000-8000-000000000001', 'b2000001-0000-4000-8000-000000000001', 1),
('d4000001-0000-4000-8000-000000000002', 'c3000001-0000-4000-8000-000000000001', 'bronze-2', 'Why Your Brain Feels Full', 2, 250, 'a1000001-0000-4000-8000-000000000002', 'b2000001-0000-4000-8000-000000000002', 2),
('d4000001-0000-4000-8000-000000000003', 'c3000001-0000-4000-8000-000000000001', 'bronze-3', 'The Animal That Refuses to Die', 3, 300, 'a1000001-0000-4000-8000-000000000003', 'b2000001-0000-4000-8000-000000000003', 3),
('d4000001-0000-4000-8000-000000000004', 'c3000001-0000-4000-8000-000000000001', 'bronze-4', 'The Two-Minute Rule', 4, 350, 'a1000001-0000-4000-8000-000000000004', 'b2000001-0000-4000-8000-000000000004', 4),
('d4000001-0000-4000-8000-000000000005', 'c3000001-0000-4000-8000-000000000001', 'bronze-5', 'Why Free Trials End on Tuesday', 5, 400, 'a1000001-0000-4000-8000-000000000005', 'b2000001-0000-4000-8000-000000000005', 5)
ON CONFLICT (slug) DO NOTHING;
